// npm run migrate:uk [-- --dry-run] [-- --force]
// One-off move of an existing database from the Bangladesh store (taka, BD addresses, COD/bKash/Nagad/SSLCommerz)
// to the UK store (US dollars in cents, UK addresses, Stripe/PayPal). Converts in place; nothing is deleted.
// - Products: dollar prices from the price ladder (scripts/seed/usd.ts); variant price overrides scaled to match.
// - Orders: every line repriced from its product's new price; totals recalculated. Demo orders (@demo.oxfordvale.example)
//   get UK customers, addresses and Stripe/PayPal payments; other orders keep their address (country BD).
// - Leads, coupons, delivery options and store settings follow. Runs once (marker in the "migrations" collection).
import path from "node:path";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import mongoose, { type Types } from "mongoose";
import { connectDB, disconnectDB } from "@/server/db";
import { CouponModel, DeliveryZoneModel, LeadModel, OrderModel, ProductModel, SettingModel, VariantModel } from "@/models";
import { syncProductSummary } from "@/server/services/catalog-sync";
import { computeTotals, couponDiscount } from "@/server/services/pricing";
import { HOME_COUNTRY } from "@/lib/address";
import { formatMoney } from "@/lib/money";
import { site } from "@/data/site";
import { readProductsCsv } from "./seed/csv";
import { usdPrices } from "./seed/usd";
import { COUPONS, DELIVERY_OPTIONS } from "./seed/uk";

const MARKER = "uk-usd-2026-10";
const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const FORCE = args.includes("--force");
const log = (...m: unknown[]) => console.log(DRY ? "• [dry-run]" : "•", ...m);
const DEMO = /@demo\.oxfordvale\.example$/;

// Seeded PRNG so demo conversions are the same on every run.
let seed = 20261028;
const random = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(xs: T[]) => xs[Math.floor(random() * xs.length)];
const UK_PLACES = [
  { city: "London", county: "", postcode: "SW3 4RP" }, { city: "London", county: "", postcode: "N1 7GU" }, { city: "London", county: "", postcode: "SE10 9JL" },
  { city: "Manchester", county: "Greater Manchester", postcode: "M2 4WU" }, { city: "Edinburgh", county: "", postcode: "EH3 6SS" },
  { city: "Bristol", county: "", postcode: "BS8 1TH" }, { city: "Leeds", county: "West Yorkshire", postcode: "LS1 5DL" },
  { city: "Oxford", county: "Oxfordshire", postcode: "OX2 6HT" }, { city: "Cardiff", county: "", postcode: "CF10 1EP" }, { city: "Bath", county: "Somerset", postcode: "BA1 2QH" },
];
const STREETS = ["Hartley Road", "Kingsway Gardens", "Elm Grove", "Ashford Place", "Chester Terrace", "Mill Lane", "Abbey Close", "Rosebery Avenue"];
// Ofcom drama ranges: never a real person's number.
const dramaMobile = () => `07700900${String(Math.floor(random() * 1000)).padStart(3, "0")}`;

type OldOrder = {
  _id: Types.ObjectId; orderNo: string; status: string; paymentMethod: string; paymentStatus: string; couponCode?: string;
  customer: { name: string; phone: string; email?: string }; shippingAddress: Record<string, string>;
  items: { product: Types.ObjectId; unitPrice: number; regularPrice: number; qty: number }[];
  subtotal: number; discount?: number; total: number; payment?: Record<string, unknown>; statusHistory: { status: string; note?: string }[];
  shipment?: { courier?: string; trackingNo?: string };
};

async function main() {
  await connectDB();
  const db = mongoose.connection.db!;
  const migrations = db.collection<{ _id: string; at: Date }>("migrations");

  // Text: always safe to re-run (plain replacements of the old Bangladesh wording).
  const TEXT: [RegExp, string][] = [
    [/ Cash on delivery across Bangladesh\./g, " Free UK delivery over $125."],
    [/Buy online at Oxford Vale with cash on delivery across Bangladesh\./g, "Buy online at Oxford Vale, with free UK returns and worldwide delivery."],
    [/a dependable choice for Dhaka's warmer months\./g, "a dependable choice for warmer days."],
    [/Light enough for the Bangladeshi summer\./g, "Light enough for summer days in the city."],
    [/Light fabrics for warm Bangladeshi days\./g, "Light fabrics for warm summer days."],
  ];
  let texts = 0;
  for (const [coll, fields] of [["categories", ["description", "seoDescription"]], ["collections", ["description", "seoDescription"]], ["products", ["description", "seoDescription", "careNotes"]]] as const) {
    for (const doc of await db.collection(coll).find({}).toArray()) {
      const set: Record<string, string> = {};
      for (const f of fields) {
        const v = doc[f];
        if (typeof v !== "string") continue;
        const next = TEXT.reduce((acc, [rx, to]) => acc.replace(rx, to), v);
        if (next !== v) set[f] = next;
      }
      if (Object.keys(set).length) {
        texts++;
        if (!DRY) await db.collection(coll).updateOne({ _id: doc._id }, { $set: set });
      }
    }
  }
  log(`Text: ${texts} categories, collections and products reworded for the UK store`);
  if (!FORCE && (await migrations.findOne({ _id: MARKER }))) {
    console.log(`Already migrated (${MARKER}). Use --force to run again.`);
    return;
  }

  // 1. Price maps: product id → old taka and new cents (CSV is the source of the new prices).
  const csv = readProductsCsv(path.join(process.cwd(), "data/seed/products.csv"));
  const usd = usdPrices(csv);
  const products = await ProductModel.find().select("skuBase price salePrice").lean();
  const priceMap = new Map<string, { oldPrice: number; oldSale?: number | null; price: number; salePrice?: number }>();
  for (const p of products) {
    const n = usd.get(p.skuBase);
    if (!n) continue; // a product added in the admin: scaled below like overrides
    priceMap.set(String(p._id), { oldPrice: p.price, oldSale: p.salePrice, ...n });
  }
  const ratioFor = (productId: string) => {
    const m = priceMap.get(productId);
    return m ? m.price / m.oldPrice : 1; // 1 taka → 1 cent for anything not in the sheet
  };
  /** Old taka unit price → new cents: exact sheet prices map exactly, anything else scales. */
  const newUnit = (productId: string, taka: number) => {
    const m = priceMap.get(productId);
    if (m && taka === m.oldPrice) return m.price;
    if (m && m.oldSale && taka === m.oldSale && m.salePrice) return m.salePrice;
    return Math.round(taka * ratioFor(productId));
  };

  // 2. Delivery options (the Bangladesh zones become the UK / Europe / world options).
  const oldZones = await DeliveryZoneModel.countDocuments({ "match.districts": { $exists: true } });
  if (!DRY) {
    await DeliveryZoneModel.collection.deleteMany({ countries: { $exists: false } });
    for (const z of DELIVERY_OPTIONS) await DeliveryZoneModel.updateOne({ name: z.name }, { $set: z }, { upsert: true });
  }
  log(`Delivery: replaced ${oldZones} Bangladesh zones with ${DELIVERY_OPTIONS.map((z) => z.name).join(", ")}`);
  const zones = DRY ? DELIVERY_OPTIONS.map((z, i) => ({ ...z, _id: new mongoose.Types.ObjectId(), sortOrder: i })) : await DeliveryZoneModel.find().lean();
  const zoneByName = new Map(zones.map((z) => [z.name, z]));

  // 3. Coupons: WELCOME10 keeps its code with dollar values; FLAT500 becomes SAVE25.
  const welcome = COUPONS.find((c) => c.code === "WELCOME10")!;
  const save25 = COUPONS.find((c) => c.code === "SAVE25")!;
  if (!DRY) {
    await CouponModel.updateOne({ code: "WELCOME10" }, { $set: { description: welcome.description, minOrder: welcome.minOrder } });
    const flat = await CouponModel.findOne({ code: "FLAT500" }).lean();
    if (flat) await CouponModel.updateOne({ _id: flat._id }, { $set: { code: "SAVE25", description: save25.description, value: save25.value, minOrder: save25.minOrder } });
    else await CouponModel.updateOne({ code: "SAVE25" }, { $setOnInsert: save25 }, { upsert: true });
    // Any other (admin-made) coupon keeps its numbers: 1 taka becomes 1 cent.
  }
  log("Coupons: WELCOME10 (10% over $100), FLAT500 → SAVE25 ($25 off $200)");

  // 4. Orders.
  const orders = (await OrderModel.collection.find({}).toArray()) as unknown as OldOrder[];
  let converted = 0;
  for (const o of orders) {
    if (o.shippingAddress?.line1 && typeof o.shippingAddress.country === "string") continue; // already new shape
    const demo = DEMO.test(o.customer?.email ?? "");
    const items = o.items.map((i) => {
      const unitPrice = newUnit(String(i.product), i.unitPrice);
      const regularPrice = newUnit(String(i.product), i.regularPrice);
      return { ...i, unitPrice, regularPrice, lineTotal: unitPrice * i.qty };
    });
    const subtotal = items.reduce((n, i) => n + i.lineTotal, 0);
    const couponCode = o.couponCode === "FLAT500" ? "SAVE25" : o.couponCode;
    const coupon = couponCode === "WELCOME10" ? welcome : couponCode === "SAVE25" ? save25 : null;
    const discount = coupon ? couponDiscount(coupon as { type: "percent" | "fixed"; value: number }, subtotal) : Math.round((o.discount ?? 0) * (subtotal / Math.max(1, o.subtotal)));

    // Address and contact.
    const old = o.shippingAddress;
    let shippingAddress: Record<string, string>;
    let phone = o.customer.phone;
    if (demo) {
      const place = pick(UK_PLACES);
      phone = dramaMobile();
      shippingAddress = { name: old.name, phone, line1: `${1 + Math.floor(random() * 120)} ${pick(STREETS)}`, line2: "", city: place.city, county: place.county, postcode: place.postcode, country: HOME_COUNTRY };
    } else {
      shippingAddress = { name: old.name, phone: old.phone, line1: old.addressLine ?? "", line2: old.upazila ?? "", city: old.district ?? "", county: old.division ?? "", postcode: "", country: "BD" };
    }
    const option = zoneByName.get(shippingAddress.country === HOME_COUNTRY ? (random() < 0.2 ? "UK Next day" : "UK Standard") : "Rest of the world")!;
    const totals = computeTotals({
      lines: items.map((i) => ({ unitPrice: i.unitPrice, qty: i.qty })),
      coupon: coupon && subtotal >= coupon.minOrder ? (coupon as { type: "percent" | "fixed"; value: number }) : null,
      deliveryFee: option.fee,
      freeDeliveryThreshold: option.freeEligible ? site.freeDeliveryThreshold : 0,
    });

    // Payment: online only. Paid orders keep "paid"; COD orders that were never paid become unpaid card orders.
    const method = o.paymentMethod === "paypal" || (demo && random() < 0.25) ? "paypal" : "stripe";
    const paid = o.paymentStatus === "paid" || (demo && !["pending", "cancelled"].includes(o.status));
    const paymentStatus = paid ? "paid" : o.paymentStatus === "refunded" ? "refunded" : o.paymentStatus === "failed" ? "failed" : "unpaid";
    const payment = paid ? { sessionId: `migrated_${o.orderNo}`, gatewayTranId: `${method === "stripe" ? "pi_demo" : "PAYDEMO"}${o.orderNo.replace(/\D/g, "")}`, brand: method === "paypal" ? "PayPal" : pick(["card (visa)", "card (mastercard)", "card (amex)", "apple_pay", "klarna"]), verifiedAt: new Date() } : {};
    const courier = shippingAddress.country === HOME_COUNTRY ? (option.name === "UK Next day" ? "DPD" : "Royal Mail") : "DHL Express";
    const statusHistory = o.statusHistory.map((h) => ({
      ...h,
      note: (h.note ?? "")
        .replace(/Shipped with \w+/, `Shipped with ${courier}`)
        .replace(/Paid online via SSLCommerz.*|.*(bKash|Nagad).*verified.*/, `Paid online via ${method === "stripe" ? "Stripe" : "PayPal"}`),
    }));

    const set = {
      items,
      subtotal: totals.subtotal,
      // Known coupons are recalculated; an unknown one keeps its discount, scaled with the subtotal.
      discount: coupon ? totals.discount : discount,
      total: coupon ? totals.total : Math.max(0, totals.subtotal - discount) + totals.deliveryFee,
      ...(couponCode && { couponCode }),
      delivery: { zone: option._id, name: option.name, fee: totals.deliveryFee, etaMinDays: option.etaMinDays, etaMaxDays: option.etaMaxDays },
      shippingAddress,
      "customer.phone": phone,
      paymentMethod: method,
      paymentStatus,
      payment,
      statusHistory,
      ...(o.shipment?.courier && { shipment: { courier, trackingNo: `${courier === "Royal Mail" ? "RM" : courier === "DPD" ? "DPD" : "DHL"}${o.orderNo.slice(-4)}GB` } }),
    };
    if (!DRY) await OrderModel.collection.updateOne({ _id: o._id }, { $set: set });
    converted++;
  }
  log(`Orders: converted ${converted} of ${orders.length} (demo orders moved to UK customers; others keep their address)`);

  // 5. Leads: basket values in cents; demo leads get drama-range phone numbers.
  const leads = await LeadModel.collection.find({}).toArray();
  for (const l of leads) {
    const snapshot = (l.cartSnapshot ?? []) as { sku: string; unitPrice: number; qty: number }[];
    const skuBase = (sku: string) => sku.split("-").slice(0, 3).join("-");
    const bySku = new Map(products.map((p) => [p.skuBase, String(p._id)]));
    const cartSnapshot = snapshot.map((i) => {
      const id = bySku.get(skuBase(i.sku));
      return { ...i, unitPrice: id ? newUnit(id, i.unitPrice) : i.unitPrice };
    });
    const set = { cartSnapshot, cartValue: cartSnapshot.reduce((n, i) => n + i.unitPrice * i.qty, 0), ...(DEMO.test(String(l.email ?? "")) && { phone: dramaMobile() }) };
    if (!DRY) await LeadModel.collection.updateOne({ _id: l._id }, { $set: set });
  }
  log(`Leads: ${leads.length} basket values converted`);

  // 6. Products and variant overrides (after orders, which needed the old prices).
  for (const p of products) {
    const m = priceMap.get(String(p._id));
    const ratio = ratioFor(String(p._id));
    if (!DRY) {
      await ProductModel.updateOne(
        { _id: p._id },
        m ? (m.salePrice ? { $set: { price: m.price, salePrice: m.salePrice } } : { $set: { price: m.price }, $unset: { salePrice: 1 } }) : [{ $set: { price: { $round: [{ $multiply: ["$price", ratio] }, 0] } } }],
      );
      const overrides = await VariantModel.find({ product: p._id, priceOverride: { $ne: null } }).select("priceOverride").lean();
      for (const v of overrides) await VariantModel.updateOne({ _id: v._id }, { priceOverride: newUnit(String(p._id), v.priceOverride!) });
      await syncProductSummary(String(p._id));
    }
  }
  const sample = csv.slice(0, 3).map((r) => `${r.name} ${formatMoney(usd.get(r.sku)!.price)}`).join(", ");
  log(`Products: ${products.length} repriced in dollars (e.g. ${sample})`);

  // 7. Store settings: UK details; hero, banner and store name are kept.
  if (!DRY) {
    await SettingModel.updateOne(
      { key: "store" },
      {
        $set: {
          legal: site.legal,
          contact: { phone: site.phoneDisplay, freephone: site.freephoneDisplay, email: site.email, supportEmail: site.supportEmail, ordersEmail: site.ordersEmail },
          address: site.address,
          hours: site.hoursText,
          socials: site.socials,
          announcementBar: { ...site.announcement, active: true },
          freeDeliveryThreshold: site.freeDeliveryThreshold,
          payments: { stripe: true, paypal: true },
          bank: site.bank,
          invoiceFooter: site.invoiceFooter,
        },
      },
      { upsert: true },
    );
    await migrations.updateOne({ _id: MARKER }, { $set: { at: new Date() } }, { upsert: true });
  }
  log("Settings: UK business details, Stripe + PayPal, free delivery over $125");
  console.log(DRY ? "\nDry run: nothing was written." : "\nDone. Restart npm run dev (or wait for the cache) to see the new prices.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
