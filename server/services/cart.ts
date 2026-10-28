// Server cart. Identified by a random token (stored in a cookie by server/cart-cookie.ts).
// Prices are never stored on the cart: every view re-reads products and variants from the database.
import { randomBytes } from "node:crypto";
import type { Types } from "mongoose";
import { CartModel, LeadModel, ProductModel, VariantModel, type Cart } from "@/models";
import type { CartLineDTO, CartView } from "@/lib/types";
import { computeTotals, unitPriceOf } from "./pricing";
import { refreshLeadSnapshot } from "./lead";

export const MAX_QTY_PER_LINE = 10;
export const MAX_LINES = 30;

export class CartError extends Error {
  constructor(public code: "NOT_FOUND" | "OUT_OF_STOCK" | "VALIDATION", message: string) {
    super(message);
  }
}

export const newCartToken = () => randomBytes(24).toString("base64url");

type CartDoc = Cart & { _id: Types.ObjectId };

export async function findCart(token: string | undefined): Promise<CartDoc | null> {
  if (!token) return null;
  return CartModel.findOne({ cartToken: token, status: "active" }).lean<CartDoc>();
}

/** Load the cart with live prices and stock. Lines that can no longer be bought are fixed up in the DB. */
export async function buildCartView(cart: CartDoc | null, freeDeliveryThreshold: number): Promise<CartView> {
  const empty: CartView = { lines: [], count: 0, subtotal: 0, freeDeliveryThreshold, freeDeliveryGap: freeDeliveryThreshold, needsLead: !cart?.lead && !cart?.leadSkipped && !cart?.user, lead: null, notices: [] };
  if (!cart) return empty;

  const variantIds = cart.items.map((i) => i.variant);
  const [variants, products] = await Promise.all([
    VariantModel.find({ _id: { $in: variantIds } }).lean(),
    ProductModel.find({ _id: { $in: cart.items.map((i) => i.product) } }).select("name slug price salePrice images status").lean(),
  ]);
  const vById = new Map(variants.map((v) => [String(v._id), v]));
  const pById = new Map(products.map((p) => [String(p._id), p]));

  const notices: string[] = [];
  const lines: CartLineDTO[] = [];
  const keep: { variant: Types.ObjectId; product: Types.ObjectId; qty: number; addedAt?: Date | null }[] = [];

  for (const item of cart.items) {
    const v = vById.get(String(item.variant));
    const p = pById.get(String(item.product));
    if (!v || !p || !v.isActive || p.status !== "active") {
      notices.push(`${p?.name ?? "An item"} is no longer available and was removed from your bag.`);
      continue;
    }
    if (v.stock <= 0) {
      notices.push(`${p.name} (${v.size}) is sold out and was removed from your bag.`);
      continue;
    }
    let qty = item.qty;
    if (qty > v.stock) {
      qty = v.stock;
      notices.push(`Only ${v.stock} of ${p.name} (${v.size}) left, so we updated the quantity.`);
    }
    keep.push({ variant: item.variant, product: item.product, qty, addedAt: item.addedAt });
    const unitPrice = unitPriceOf(p, v);
    lines.push({
      variantId: String(v._id), productId: String(p._id), slug: p.slug, name: p.name,
      image: [...(p.images ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url ?? null,
      size: v.size, colour: v.colour, sku: v.sku, qty, unitPrice, regularPrice: v.priceOverride ?? p.price,
      lineTotal: unitPrice * qty, stock: v.stock, maxQty: Math.min(MAX_QTY_PER_LINE, v.stock),
    });
  }

  if (notices.length) await CartModel.updateOne({ _id: cart._id }, { items: keep });

  const totals = computeTotals({ lines, freeDeliveryThreshold });
  let lead: CartView["lead"] = null;
  if (cart.lead) {
    const l = await LeadModel.findById(cart.lead).select("name phone email").lean();
    if (l) lead = { name: l.name, phone: l.phone, email: l.email ?? "" };
  }
  return {
    lines,
    count: lines.reduce((n, l) => n + l.qty, 0),
    subtotal: totals.subtotal,
    freeDeliveryThreshold,
    freeDeliveryGap: totals.freeDeliveryGap,
    needsLead: !cart.lead && !cart.leadSkipped && !cart.user,
    lead,
    notices,
  };
}

export async function cartCount(token: string | undefined): Promise<number> {
  const cart = await findCart(token);
  return cart?.items.reduce((n, i) => n + i.qty, 0) ?? 0;
}

/** Add a variant (creates the cart when token is missing). Returns the token to store in the cookie. */
export async function addItem(token: string | undefined, variantId: string, qty: number): Promise<{ token: string; cart: CartDoc }> {
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) throw new CartError("VALIDATION", "Choose a quantity between 1 and 10.");
  const variant = await VariantModel.findById(variantId).lean();
  if (!variant || !variant.isActive) throw new CartError("NOT_FOUND", "This item is no longer available.");
  const product = await ProductModel.findOne({ _id: variant.product, status: "active" }).select("_id").lean();
  if (!product) throw new CartError("NOT_FOUND", "This item is no longer available.");

  let cart = await findCart(token);
  if (!cart) {
    token = newCartToken();
    cart = (await CartModel.create({ cartToken: token, items: [] })).toObject() as CartDoc;
  }

  const existing = cart.items.find((i) => String(i.variant) === variantId);
  const nextQty = (existing?.qty ?? 0) + qty;
  if (variant.stock <= 0) throw new CartError("OUT_OF_STOCK", "Sorry, this size is sold out.");
  if (nextQty > variant.stock) {
    throw new CartError("OUT_OF_STOCK", existing ? `Only ${variant.stock} available and you already have ${existing.qty} in your bag.` : `Only ${variant.stock} available.`);
  }
  if (nextQty > MAX_QTY_PER_LINE) throw new CartError("VALIDATION", `You can order up to ${MAX_QTY_PER_LINE} of one item.`);
  if (!existing && cart.items.length >= MAX_LINES) throw new CartError("VALIDATION", "Your bag is full. Check out or remove an item first.");

  const update = existing
    ? CartModel.findOneAndUpdate({ _id: cart._id, "items.variant": variant._id }, { $set: { "items.$.qty": nextQty, lastActivityAt: new Date() } }, { returnDocument: "after" })
    : CartModel.findOneAndUpdate({ _id: cart._id }, { $push: { items: { variant: variant._id, product: variant.product, qty } }, $set: { lastActivityAt: new Date() } }, { returnDocument: "after" });
  const saved = await update.lean<CartDoc>();
  await refreshLeadSnapshot(saved!);
  return { token: token!, cart: saved! };
}

/** Set a line's quantity (0 removes it). */
export async function setItemQty(token: string | undefined, variantId: string, qty: number): Promise<CartDoc> {
  const cart = await findCart(token);
  if (!cart) throw new CartError("NOT_FOUND", "Your bag has expired. Please add the items again.");
  if (!Number.isInteger(qty) || qty < 0 || qty > MAX_QTY_PER_LINE) throw new CartError("VALIDATION", "Choose a quantity between 1 and 10.");
  if (qty > 0) {
    const v = await VariantModel.findById(variantId).select("stock").lean();
    if (!v) throw new CartError("NOT_FOUND", "This item is no longer available.");
    if (qty > v.stock) throw new CartError("OUT_OF_STOCK", `Only ${v.stock} available.`);
  }
  const saved = await CartModel.findOneAndUpdate(
    { _id: cart._id },
    qty > 0
      ? { $set: { "items.$[line].qty": qty, lastActivityAt: new Date() } }
      : { $pull: { items: { variant: variantId } }, $set: { lastActivityAt: new Date() } },
    { returnDocument: "after", ...(qty > 0 && { arrayFilters: [{ "line.variant": variantId }] }) },
  ).lean<CartDoc>();
  await refreshLeadSnapshot(saved!);
  return saved!;
}

export async function markLeadSkipped(token: string | undefined) {
  if (!token) return;
  await CartModel.updateOne({ cartToken: token, status: "active" }, { leadSkipped: true });
}

