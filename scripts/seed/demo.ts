// Demo orders, leads and messages so the admin dashboard has something to show (npm run seed -- --demo).
// Every demo record uses an @demo.oxfordvale.example email, so `--demo-clear` removes exactly these.
import {
  ContactMessageModel, CouponModel, DeliveryZoneModel, LeadModel, OrderModel, ProductModel, VariantModel, type OrderStatus, type PaymentMethod, type PaymentStatus,
} from "@/models";
import { nextOrderNo } from "@/server/services/order";
import { optionsFor } from "@/server/services/zone-match";
import { computeTotals, unitPriceOf } from "@/server/services/pricing";
import { restoreOrderStock } from "@/server/services/stock";
import { syncProductSummary } from "@/server/services/catalog-sync";
import { HOME_COUNTRY } from "@/lib/address";
import type { Types } from "mongoose";

export const DEMO_DOMAIN = "demo.oxfordvale.example";
const demoEmail = { $regex: `@${DEMO_DOMAIN.replace(/\./g, "\\.")}$` };

// Small seeded PRNG so every run produces the same demo data.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

// Fictional customers. Phone numbers come from Ofcom's ranges reserved for drama (07700 900xxx, 020 7946 0xxx).
const FIRST = ["James", "Oliver", "Harry", "Thomas", "William", "Arjun", "Daniel", "Samuel", "Edward", "Henry", "Omar", "George", "Callum", "Rhys", "Finlay", "Luca"];
const LAST = ["Clarke", "Hughes", "Turner", "Bennett", "Patel", "Walker", "Wright", "Evans", "Shaw", "Fletcher", "Morgan", "Reid"];
// Made-up streets in real towns; postcodes are valid in format only.
const UK_PLACES = [
  { city: "London", county: "", postcodes: ["SW3 4RP", "N1 7GU", "SE10 9JL", "W11 2BQ", "EC1V 4PW"] },
  { city: "Manchester", county: "Greater Manchester", postcodes: ["M2 4WU", "M20 2RN"] },
  { city: "Edinburgh", county: "", postcodes: ["EH3 6SS", "EH10 4BF"] },
  { city: "Bristol", county: "", postcodes: ["BS8 1TH", "BS6 5QA"] },
  { city: "Leeds", county: "West Yorkshire", postcodes: ["LS1 5DL", "LS6 2AB"] },
  { city: "Oxford", county: "Oxfordshire", postcodes: ["OX2 6HT", "OX4 1EH"] },
  { city: "Cardiff", county: "", postcodes: ["CF10 1EP", "CF24 4HQ"] },
  { city: "Bath", county: "Somerset", postcodes: ["BA1 2QH"] },
];
const ABROAD = [
  { city: "Paris", county: "", postcode: "75007", country: "FR" },
  { city: "Dublin", county: "", postcode: "D02 X285", country: "IE" },
  { city: "Berlin", county: "", postcode: "10117", country: "DE" },
  { city: "New York", county: "NY", postcode: "10014", country: "US" },
];
const STREETS = ["Hartley Road", "Kingsway Gardens", "Elm Grove", "Ashford Place", "Chester Terrace", "Mill Lane", "Abbey Close", "Rosebery Avenue"];

// Status mix for 30 days of orders: older orders are further along.
function lifecycle(ageDays: number, r: number): OrderStatus {
  if (r < 0.08) return "cancelled";
  if (ageDays < 1) return r < 0.7 ? "pending" : "confirmed";
  if (ageDays < 3) return r < 0.3 ? "pending" : r < 0.6 ? "confirmed" : r < 0.85 ? "processing" : "shipped";
  if (ageDays < 6) return r < 0.2 ? "processing" : r < 0.6 ? "shipped" : "delivered";
  return r < 0.04 ? "returned" : "delivered";
}
const PATH: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

export async function clearDemo() {
  const orders = await OrderModel.find({ "customer.email": demoEmail }).select("_id items stockRestoredAt couponCode status").lean();
  for (const o of orders) await restoreOrderStock(o._id); // no-op for orders whose stock was already restored
  const coupons = orders.filter((o) => o.couponCode && o.status !== "cancelled").map((o) => o.couponCode!);
  for (const code of coupons) await CouponModel.updateOne({ code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
  const [o, l, m] = await Promise.all([
    OrderModel.deleteMany({ "customer.email": demoEmail }),
    LeadModel.deleteMany({ email: demoEmail }),
    ContactMessageModel.deleteMany({ email: demoEmail }),
  ]);
  const products = new Set(orders.flatMap((x) => x.items.map((i) => String(i.product))));
  for (const id of products) await syncProductSummary(id);
  return { orders: o.deletedCount, leads: l.deletedCount, messages: m.deletedCount };
}

export async function seedDemo(count = 48) {
  await clearDemo();
  const random = rng(20261022);
  const pick = <T,>(xs: T[]) => xs[Math.floor(random() * xs.length)];

  const zones = (await DeliveryZoneModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean()).map((z) => ({
    id: String(z._id), name: z.name, fee: z.fee, etaMinDays: z.etaMinDays, etaMaxDays: z.etaMaxDays,
    countries: z.countries ?? [], freeEligible: Boolean(z.freeEligible),
  }));
  const products = await ProductModel.find({ status: "active", inStock: true }).select("name slug price salePrice images").lean();
  if (!products.length || !zones.length) throw new Error("Seed the catalog and delivery options first (npm run seed).");
  const variants = await VariantModel.find({ product: { $in: products.map((p) => p._id) }, isActive: true, stock: { $gte: 3 } }).lean();
  const byProduct = new Map(products.map((p) => [String(p._id), p]));

  const address = () => {
    const line1 = `${1 + Math.floor(random() * 120)} ${pick(STREETS)}`;
    if (random() < 0.88) {
      const place = pick(UK_PLACES);
      return { line1, line2: "", city: place.city, county: place.county, postcode: pick(place.postcodes), country: HOME_COUNTRY };
    }
    const place = pick(ABROAD);
    return { line1, line2: "", city: place.city, county: place.county, postcode: place.postcode, country: place.country };
  };
  const ukPhone = () => (random() < 0.8 ? `07700900${String(Math.floor(random() * 1000)).padStart(3, "0")}` : `0207946${String(Math.floor(random() * 1000)).padStart(4, "0")}`);

  const now = Date.now();
  const touched = new Set<string>();
  let created = 0;
  for (let n = 0; n < count; n++) {
    const ageDays = Math.pow(random(), 1.4) * 30; // more recent orders than old ones
    const createdAt = new Date(now - ageDays * 864e5);
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    const phone = ukPhone();
    const email = `${name.toLowerCase().replace(/\s+/g, ".")}.${n}@${DEMO_DOMAIN}`;
    const area = address();
    const options = optionsFor(zones, area.country);
    const zone = area.country === HOME_COUNTRY && options.length > 1 && random() < 0.2 ? options[1] : options[0]; // most UK orders go standard

    const status = lifecycle(ageDays, random());
    const lineCount = 1 + Math.floor(random() * random() * 3);
    const lines: { product: Types.ObjectId; variant: Types.ObjectId; sku: string; name: string; size: string; colour: string; image: string; regularPrice: number; unitPrice: number; qty: number; lineTotal: number }[] = [];
    for (let i = 0; i < lineCount; i++) {
      const v = pick(variants);
      const p = byProduct.get(String(v.product))!;
      if (lines.some((l) => String(l.variant) === String(v._id))) continue;
      const unitPrice = unitPriceOf(p, v);
      const qty = random() < 0.85 ? 1 : 2;
      // Live orders hold their stock; keep the line only if the stock was really taken (cancelled ones never took it).
      if (status !== "cancelled" && (await VariantModel.updateOne({ _id: v._id, stock: { $gte: qty } }, { $inc: { stock: -qty } })).modifiedCount !== 1) continue;
      const image = [...(p.images ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url ?? "";
      lines.push({ product: p._id, variant: v._id, sku: v.sku, name: p.name, size: v.size, colour: v.colour, image, regularPrice: v.priceOverride ?? p.price, unitPrice, qty, lineTotal: unitPrice * qty });
    }
    const coupon = random() < 0.15 ? await CouponModel.findOne({ code: "WELCOME10" }).lean() : null;
    const totals = computeTotals({ lines, coupon: coupon && lines.reduce((s, l) => s + l.lineTotal, 0) >= coupon.minOrder ? coupon : null, deliveryFee: zone.fee, freeDeliveryThreshold: zone.freeEligible ? 12_500 : 0 });

    if (!lines.length) continue;
    const r = random();
    const paymentMethod: PaymentMethod = r < 0.75 ? "stripe" : "paypal";
    const reached = status === "cancelled" ? 0 : status === "returned" ? 4 : PATH.indexOf(status);
    // Online payment: everything past "pending" is paid; a pending order is a checkout that wasn't paid (yet).
    const paid = status !== "cancelled" && status !== "pending";
    const paymentStatus: PaymentStatus = paid ? "paid" : status === "pending" && random() < 0.3 ? "failed" : "unpaid";
    const brands = paymentMethod === "paypal" ? ["PayPal"] : ["card (visa)", "card (mastercard)", "card (amex)", "apple_pay", "klarna"];
    const payment: Record<string, unknown> = paid
      ? { sessionId: `demo_${n}`, gatewayTranId: `${paymentMethod === "stripe" ? "pi_demo" : "PAYDEMO"}${(n * 7919).toString(36).toUpperCase()}`, brand: pick(brands), verifiedAt: new Date(createdAt.getTime() + 2 * 60_000) }
      : {};
    const courier = area.country === HOME_COUNTRY ? (zone.etaMaxDays <= 1 ? "DPD" : "Royal Mail") : "DHL Express";

    const step = (i: number) => new Date(createdAt.getTime() + i * Math.min(ageDays / 5, 1.2) * 864e5);
    const history = [{ status: "pending" as OrderStatus, at: createdAt, note: "Order placed" }];
    if (paid) history.push({ status: "confirmed", at: new Date(createdAt.getTime() + 2 * 60_000), note: `Paid online via ${paymentMethod === "stripe" ? "Stripe" : "PayPal"} (${payment.brand})` });
    for (let i = paid ? 2 : 1; i <= reached; i++) history.push({ status: PATH[i], at: step(i), note: i === 3 ? `Shipped with ${courier}` : "" });
    if (status === "cancelled") history.push({ status: "cancelled", at: step(0.3), note: "Customer asked to cancel" });
    if (status === "returned") history.push({ status: "returned", at: step(5), note: "Wrong size, returned" });

    if (status !== "cancelled" && coupon && totals.discount) await CouponModel.updateOne({ code: coupon.code }, { $inc: { usedCount: 1 } });
    lines.forEach((l) => touched.add(String(l.product)));

    const order = await OrderModel.create({
      orderNo: await nextOrderNo(createdAt),
      customer: { name, phone, email },
      shippingAddress: { name, phone, ...area },
      items: lines,
      subtotal: totals.subtotal,
      couponCode: totals.discount ? coupon?.code : undefined,
      discount: totals.discount,
      delivery: { zone: zone.id, name: zone.name, fee: totals.deliveryFee, etaMinDays: zone.etaMinDays, etaMaxDays: zone.etaMaxDays },
      total: totals.total,
      paymentMethod,
      paymentStatus,
      payment,
      status,
      statusHistory: history,
      ...(reached >= 3 && { shipment: { courier, trackingNo: `${courier === "Royal Mail" ? "RM" : courier === "DPD" ? "DPD" : "DHL"}${100000 + n}GB` } }),
      ...(status === "cancelled" && { cancelledBy: "customer", stockRestoredAt: step(0.3) }),
      ...(status === "returned" && { stockRestoredAt: step(5) }),
      createdAt,
      updatedAt: history.at(-1)!.at,
    });
    // Returned demo orders put their stock back, like an admin choosing "restock".
    if (status === "returned") for (const l of lines) await VariantModel.updateOne({ _id: l.variant }, { $inc: { stock: l.qty } });

    await LeadModel.create({
      name, phone, email, source: random() < 0.6 ? "add_to_cart" : "checkout", status: "converted", order: order._id,
      cartSnapshot: lines.map((l) => ({ name: l.name, sku: l.sku, size: l.size, colour: l.colour, qty: l.qty, unitPrice: l.unitPrice })),
      cartValue: totals.subtotal, lastActivityAt: createdAt, createdAt,
    });
    created++;
  }

  // Open and abandoned carts.
  let leads = 0;
  for (let n = 0; n < 12; n++) {
    const minutesAgo = n < 3 ? 10 + n * 15 : 90 + Math.floor(random() * 6 * 1440);
    const at = new Date(now - minutesAgo * 60_000);
    const v = pick(variants);
    const p = byProduct.get(String(v.product))!;
    const unitPrice = unitPriceOf(p, v);
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    await LeadModel.create({
      name, phone: ukPhone(), email: `${name.toLowerCase().replace(/\s+/g, ".")}.lead${n}@${DEMO_DOMAIN}`,
      source: "add_to_cart", status: minutesAgo > 60 ? "abandoned" : "cart", abandonedAt: minutesAgo > 60 ? new Date(at.getTime() + 60 * 60_000) : undefined,
      cartSnapshot: [{ name: p.name, sku: v.sku, size: v.size, colour: v.colour, qty: 1, unitPrice }], cartValue: unitPrice, lastActivityAt: at, createdAt: at,
    });
    leads++;
  }

  await ContactMessageModel.insertMany([
    { name: "Demo Visitor", email: `visitor1@${DEMO_DOMAIN}`, subject: "Tailoring", message: "Do you offer trouser hemming for suits bought online?", status: "new", createdAt: new Date(now - 3 * 3600_000) },
    { name: "Demo Visitor", email: `visitor2@${DEMO_DOMAIN}`, subject: "Sizes", message: "Is the tweed overcoat true to size? I usually wear a 40 chest.", status: "read", createdAt: new Date(now - 2 * 864e5) },
  ]);

  for (const id of touched) await syncProductSummary(id);
  return { orders: created, leads, messages: 2 };
}
