// Leads: name/phone/email captured at first add-to-cart (skippable) or at checkout, before any order exists.
// One lead per cart. Its snapshot of the cart is refreshed on every cart change so admin sees live contents.
import type { Types } from "mongoose";
import { CartModel, LeadModel, ProductModel, VariantModel, type Cart } from "@/models";
import { unitPriceOf } from "./pricing";

type CartLike = Pick<Cart, "items" | "lead" | "user"> & { _id: Types.ObjectId };
export type LeadInput = { name: string; phone: string; email: string };

async function snapshotOf(cart: CartLike) {
  const [variants, products] = await Promise.all([
    VariantModel.find({ _id: { $in: cart.items.map((i) => i.variant) } }).select("sku size colour priceOverride").lean(),
    ProductModel.find({ _id: { $in: cart.items.map((i) => i.product) } }).select("name price salePrice").lean(),
  ]);
  const v = new Map(variants.map((x) => [String(x._id), x]));
  const p = new Map(products.map((x) => [String(x._id), x]));
  const items = cart.items.flatMap((i) => {
    const variant = v.get(String(i.variant));
    const product = p.get(String(i.product));
    if (!variant || !product) return [];
    return [{ name: product.name, sku: variant.sku, size: variant.size, colour: variant.colour, qty: i.qty, unitPrice: unitPriceOf(product, variant) }];
  });
  return { cartSnapshot: items, cartValue: items.reduce((n, i) => n + i.unitPrice * i.qty, 0) };
}

/** Create or update the cart's lead. Returns the lead id. */
export async function upsertLead(cart: CartLike, input: LeadInput, source: "add_to_cart" | "checkout"): Promise<Types.ObjectId> {
  const snapshot = await snapshotOf(cart);
  const now = new Date();
  if (cart.lead) {
    const updated = await LeadModel.findOneAndUpdate(
      { _id: cart.lead, status: { $ne: "converted" } },
      { $set: { ...input, ...snapshot, lastActivityAt: now, status: "cart" }, $unset: { abandonedAt: 1, adminNotifiedAt: 1 } },
      { returnDocument: "after" },
    ).lean();
    if (updated) return updated._id;
  }
  const lead = await LeadModel.create({ ...input, ...snapshot, cart: cart._id, user: cart.user, source, status: "cart", lastActivityAt: now });
  await CartModel.updateOne({ _id: cart._id }, { lead: lead._id });
  return lead._id;
}

/** After a cart change: keep the lead's snapshot current and revive an abandoned lead. */
export async function refreshLeadSnapshot(cart: CartLike) {
  if (!cart.lead) return;
  const snapshot = await snapshotOf(cart);
  await LeadModel.updateOne(
    { _id: cart.lead, status: { $ne: "converted" } },
    { $set: { ...snapshot, lastActivityAt: new Date(), status: "cart" }, $unset: { abandonedAt: 1, adminNotifiedAt: 1 } },
  );
}

/**
 * Mark leads idle for longer than `minutes` (with something in the cart) as abandoned.
 * Returns the leads that were newly abandoned and not yet reported to the admin.
 */
export async function sweepAbandonedLeads(minutes: number, now = new Date()) {
  const cutoff = new Date(now.getTime() - minutes * 60_000);
  const filter = { status: "cart" as const, lastActivityAt: { $lt: cutoff }, cartValue: { $gt: 0 } };
  const due = await LeadModel.find(filter).select("_id").lean();
  if (!due.length) return [];
  const ids = due.map((d) => d._id);
  await LeadModel.updateMany({ _id: { $in: ids }, status: "cart" }, { status: "abandoned", abandonedAt: now });
  return LeadModel.find({ _id: { $in: ids }, adminNotifiedAt: { $exists: false } }).lean();
}
