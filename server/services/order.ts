// Order placement and lifecycle. Everything price-related is recomputed here from the database.
import type { Types } from "mongoose";
import { CartModel, LeadModel, nextSeq, OrderModel, ProductModel, VariantModel, type Order, type OrderStatus, type PaymentMethod } from "@/models";
import { computeTotals, unitPriceOf, type Totals } from "./pricing";
import { claimCoupon, CouponError, releaseCoupon, validateCoupon } from "./coupon";
import { releaseStock, reserveStock, restoreOrderStock, StockError } from "./stock";
import { resolveZone, type AddressArea } from "./zone-match";
import { upsertLead } from "./lead";
import { syncProductSummary } from "./catalog-sync";
import { findCart } from "./cart";
import type { ZoneDTO } from "./delivery";

export class OrderError extends Error {
  constructor(public code: "VALIDATION" | "NOT_FOUND" | "OUT_OF_STOCK" | "CONFLICT", message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

export type CheckoutContact = { name: string; phone: string; email: string };
export type CheckoutAddress = AddressArea & { name: string; phone: string; addressLine: string };
export type StoreRules = {
  zones: ZoneDTO[];
  freeDeliveryThreshold: number;
  payments: { cod: boolean; sslcommerz: boolean; bkash: { enabled: boolean }; nagad: { enabled: boolean } };
};

type PricedLine = {
  product: Types.ObjectId; variant: Types.ObjectId; sku: string; name: string; slug: string; size: string; colour: string;
  image: string; regularPrice: number; unitPrice: number; qty: number; lineTotal: number; stock: number;
};

/** Current cart lines with live prices. Lines that changed (gone, sold out, less stock) are reported, not silently fixed. */
export async function priceCart(cartToken: string | undefined) {
  const cart = await findCart(cartToken);
  if (!cart || !cart.items.length) throw new OrderError("NOT_FOUND", "Your bag is empty.");
  const [variants, products] = await Promise.all([
    VariantModel.find({ _id: { $in: cart.items.map((i) => i.variant) } }).lean(),
    ProductModel.find({ _id: { $in: cart.items.map((i) => i.product) } }).select("name slug price salePrice images status").lean(),
  ]);
  const v = new Map(variants.map((x) => [String(x._id), x]));
  const p = new Map(products.map((x) => [String(x._id), x]));
  const problems: string[] = [];
  const lines: PricedLine[] = [];
  for (const item of cart.items) {
    const variant = v.get(String(item.variant));
    const product = p.get(String(item.product));
    if (!variant || !product || !variant.isActive || product.status !== "active") {
      problems.push(`${product?.name ?? "An item"} is no longer available.`);
      continue;
    }
    if (variant.stock < item.qty) {
      problems.push(variant.stock === 0 ? `${product.name} (${variant.size}) is sold out.` : `Only ${variant.stock} of ${product.name} (${variant.size}) left.`);
      continue;
    }
    const unitPrice = unitPriceOf(product, variant);
    lines.push({
      product: product._id, variant: variant._id, sku: variant.sku, name: product.name, slug: product.slug, size: variant.size, colour: variant.colour,
      image: [...(product.images ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url ?? "",
      regularPrice: variant.priceOverride ?? product.price, unitPrice, qty: item.qty, lineTotal: unitPrice * item.qty, stock: variant.stock,
    });
  }
  return { cart, lines, problems };
}

export type Quote = Totals & { zone: { id: string; name: string; fee: number; etaMinDays: number; etaMaxDays: number } | null; couponCode: string | null; couponError: string | null };

/** Totals for the checkout summary (and the order itself). */
export async function quote(lines: { unitPrice: number; qty: number }[], rules: StoreRules, opts: { address?: AddressArea | null; couponCode?: string | null; phone?: string }): Promise<Quote & { coupon: Awaited<ReturnType<typeof validateCoupon>> | null }> {
  const zone = opts.address?.district ? resolveZone(rules.zones, opts.address) : null;
  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.qty, 0);
  let coupon: Awaited<ReturnType<typeof validateCoupon>> | null = null;
  let couponError: string | null = null;
  if (opts.couponCode?.trim()) {
    try {
      coupon = await validateCoupon(opts.couponCode, { subtotal, phone: opts.phone });
    } catch (err) {
      if (!(err instanceof CouponError)) throw err;
      couponError = err.message;
    }
  }
  const totals = computeTotals({ lines, coupon, deliveryFee: zone?.fee ?? null, freeDeliveryThreshold: rules.freeDeliveryThreshold });
  return {
    ...totals,
    zone: zone ? { id: zone.id, name: zone.name, fee: zone.fee, etaMinDays: zone.etaMinDays, etaMaxDays: zone.etaMaxDays } : null,
    couponCode: coupon?.code ?? null,
    couponError,
    coupon,
  };
}

/** "OV-261022-0001": date in Bangladesh time + a daily sequence. */
export async function nextOrderNo(now = new Date()) {
  const d = new Date(now.getTime() + 6 * 3600_000); // UTC+6, no DST
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const seq = await nextSeq(`order-${ymd}`);
  return `OV-${ymd}-${String(seq).padStart(4, "0")}`;
}

export function isPaymentEnabled(method: PaymentMethod, rules: StoreRules) {
  return method === "cod" ? rules.payments.cod : method === "sslcommerz" ? rules.payments.sslcommerz : rules.payments[method].enabled;
}

export type PlaceOrderInput = {
  cartToken: string | undefined;
  userId?: string | null;
  contact: CheckoutContact;
  address: CheckoutAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string | null;
  note?: string;
};

export async function placeOrder(input: PlaceOrderInput, rules: StoreRules) {
  const { cart, lines, problems } = await priceCart(input.cartToken);
  if (problems.length) throw new OrderError("CONFLICT", `Your bag changed: ${problems.join(" ")} Please review it before ordering.`);
  if (!lines.length) throw new OrderError("NOT_FOUND", "Your bag is empty.");
  if (!isPaymentEnabled(input.paymentMethod, rules)) throw new OrderError("VALIDATION", "This payment method isn't available right now.", { paymentMethod: "Choose another payment method." });

  const q = await quote(lines, rules, { address: input.address, couponCode: input.couponCode, phone: input.contact.phone });
  if (!q.zone) throw new OrderError("VALIDATION", "We can't deliver to this address yet.", { upazila: "We can't deliver to this area yet." });
  if (q.couponError) throw new OrderError("VALIDATION", q.couponError, { couponCode: q.couponError });

  // Reserve stock, then the coupon; undo in reverse order on any failure.
  try {
    await reserveStock(lines.map((l) => ({ variant: l.variant, qty: l.qty, name: l.name, size: l.size })));
  } catch (err) {
    if (err instanceof StockError) throw new OrderError("OUT_OF_STOCK", err.message);
    throw err;
  }
  const undoStock = () => releaseStock(lines.map((l) => ({ variant: l.variant, qty: l.qty })));
  if (q.couponCode && !(await claimCoupon(q.couponCode))) {
    await undoStock();
    throw new OrderError("VALIDATION", "This coupon has just reached its usage limit.", { couponCode: "This coupon has just reached its usage limit." });
  }

  let order: Order & { _id: Types.ObjectId };
  try {
    const leadId = await upsertLead(cart, input.contact, "checkout");
    order = (
      await OrderModel.create({
        orderNo: await nextOrderNo(),
        user: input.userId ?? cart.user ?? undefined,
        cart: cart._id,
        lead: leadId,
        customer: input.contact,
        shippingAddress: {
          name: input.address.name, phone: input.address.phone, division: input.address.division, district: input.address.district,
          upazila: input.address.upazila, addressLine: input.address.addressLine,
        },
        items: lines.map(({ stock: _s, slug: _slug, ...l }) => l),
        subtotal: q.subtotal,
        couponCode: q.couponCode ?? undefined,
        discount: q.discount,
        delivery: { zone: q.zone.id, name: q.zone.name, fee: q.deliveryFee, etaMinDays: q.zone.etaMinDays, etaMaxDays: q.zone.etaMaxDays },
        total: q.total,
        note: input.note ?? "",
        paymentMethod: input.paymentMethod,
        paymentStatus: "unpaid",
        status: "pending",
        statusHistory: [{ status: "pending", at: new Date(), note: "Order placed" }],
      })
    ).toObject();
  } catch (err) {
    await undoStock();
    if (q.couponCode) await releaseCoupon(q.couponCode);
    throw err;
  }

  await Promise.all([
    LeadModel.updateOne({ _id: order.lead }, { status: "converted", order: order._id, lastActivityAt: new Date() }),
    CartModel.updateOne({ _id: cart._id }, { status: "converted" }),
    ...[...new Set(lines.map((l) => String(l.product)))].map((id) => syncProductSummary(id)),
  ]);
  return { order, slugs: [...new Set(lines.map((l) => l.slug))] };
}

/** Customer cancellation: only while Pending. Restores stock and coupon usage. */
export async function cancelOrder(orderNo: string, by: "customer" | "admin" | "system", note?: string) {
  const order = await OrderModel.findOneAndUpdate(
    { orderNo, status: "pending" },
    { status: "cancelled", cancelledBy: by, $push: { statusHistory: { status: "cancelled", at: new Date(), note: note ?? `Cancelled by ${by}` } } },
    { returnDocument: "after" },
  ).lean();
  if (!order) throw new OrderError("CONFLICT", "This order can no longer be cancelled. Please contact us.");
  await restoreOrderStock(order._id);
  if (order.couponCode) await releaseCoupon(order.couponCode);
  await Promise.all([...new Set(order.items.map((i) => String(i.product)))].map((id) => syncProductSummary(id)));
  return order;
}

/** Mark an online payment as paid (SSLCommerz validated, or admin verified a bKash/Nagad transaction). */
export async function markOrderPaid(orderNo: string, payment: Record<string, unknown>, note: string, by?: string) {
  const order = await OrderModel.findOneAndUpdate(
    { orderNo, paymentStatus: { $ne: "paid" }, status: { $nin: ["cancelled", "refunded"] } },
    {
      paymentStatus: "paid",
      ...Object.fromEntries(Object.entries(payment).map(([k, v]) => [`payment.${k}`, v])),
      status: "confirmed",
      $push: { statusHistory: { status: "confirmed", at: new Date(), note, ...(by && { by }) } },
    },
    { returnDocument: "after" },
  ).lean();
  return order;
}

export async function markPaymentFailed(orderNo: string, note: string) {
  return OrderModel.findOneAndUpdate(
    { orderNo, paymentStatus: "unpaid", status: "pending" },
    { paymentStatus: "failed", $push: { statusHistory: { status: "pending", at: new Date(), note } } },
    { returnDocument: "after" },
  ).lean();
}

export const CUSTOMER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending", confirmed: "Confirmed", processing: "Processing", shipped: "Shipped", delivered: "Delivered",
  cancelled: "Cancelled", returned: "Returned", refunded: "Refunded",
};
