import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CollectionModel, CouponModel, OrderModel, ProductModel, VariantModel } from "@/models";
import { addItem } from "@/server/services/cart";
import { markOrderPaid, placeOrder, type StoreRules } from "@/server/services/order";
import { transitionOrder, TRANSITIONS } from "@/server/services/order-admin";
import { duplicateProduct, saveProduct, type ProductData } from "@/server/services/product-admin";
import { getDashboard } from "@/server/services/admin-dashboard";
import { orderFilter } from "@/server/services/admin-orders";
import { listCustomers } from "@/server/services/admin-customers";
import { can } from "@/server/auth/rbac";
import { toCsv } from "@/lib/csv";
import { clearDb, startDb, stopDb } from "./helpers/db";
import { seedProduct } from "./helpers/fixtures";

process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-123";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

const ZONE = "000000000000000000000001";
const rules: StoreRules = {
  zones: [{ id: ZONE, name: "Everywhere", fee: 595, etaMinDays: 1, etaMaxDays: 3, countries: [], freeEligible: false, note: "" }],
  freeDeliveryThreshold: 0,
  payments: { stripe: true, paypal: true },
};
const contact = { name: "Test Customer", phone: "07700900009", email: "test@example.com" };
const address = { name: "Test Customer", phone: "07700900009", line1: "1 Test Street", line2: "", city: "London", county: "", postcode: "W1S 3PR", country: "GB" };
const admin = { id: "000000000000000000000abc", name: "Admin" };

/** A placed order; `paid` confirms it the way the Stripe / PayPal return does. */
async function order({ paid = true, qty = 2, couponCode }: { paid?: boolean; qty?: number; couponCode?: string } = {}) {
  const fx = await seedProduct();
  const { token } = await addItem(undefined, String(fx.m._id), qty);
  const { order } = await placeOrder({ cartToken: token, contact, address, deliveryOption: ZONE, paymentMethod: "stripe", couponCode }, rules);
  if (paid) await markOrderPaid(order.orderNo, { gatewayTranId: "pi_test", brand: "card (visa)" }, "Paid online via Stripe");
  return { ...fx, order };
}
const stockOf = async (id: unknown) => (await VariantModel.findById(id).lean())!.stock;

describe("RBAC", () => {
  it("matches the plan's role table", () => {
    expect(can("staff", "orders")).toBe(true);
    expect(can("staff", "catalog.view")).toBe(true);
    expect(can("staff", "catalog.edit")).toBe(false);
    expect(can("manager", "catalog.edit")).toBe(true);
    expect(can("manager", "settings")).toBe(false);
    expect(can("owner", "users")).toBe(true);
    expect(can("customer", "dashboard")).toBe(false);
  });
});

describe("order status changes", () => {
  it("only allows the defined transitions", async () => {
    const { order: o } = await order({ paid: false });
    await expect(transitionOrder(o.orderNo, { to: "delivered" }, admin)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(TRANSITIONS.refunded).toEqual([]);
  });

  it("won't confirm an unpaid order by hand; an unpaid order can only be cancelled", async () => {
    const { order: o } = await order({ paid: false });
    await expect(transitionOrder(o.orderNo, { to: "confirmed" }, admin)).rejects.toMatchObject({ code: "CONFLICT" });
    await transitionOrder(o.orderNo, { to: "cancelled" }, admin);
    expect((await OrderModel.findOne({ orderNo: o.orderNo }).lean())!.status).toBe("cancelled");
  });

  it("walks a paid order to delivered; history records who did it", async () => {
    const { order: o } = await order();
    expect((await OrderModel.findOne({ orderNo: o.orderNo }).lean())!.status).toBe("confirmed"); // payment confirms it
    await transitionOrder(o.orderNo, { to: "processing" }, admin);
    await expect(transitionOrder(o.orderNo, { to: "shipped" }, admin)).rejects.toMatchObject({ code: "VALIDATION" }); // courier required
    await transitionOrder(o.orderNo, { to: "shipped", courier: "Royal Mail", trackingNo: "RM123GB" }, admin);
    await transitionOrder(o.orderNo, { to: "delivered", note: "Signed by customer" }, admin);
    const saved = (await OrderModel.findOne({ orderNo: o.orderNo }).lean())!;
    expect(saved).toMatchObject({ status: "delivered", paymentStatus: "paid", shipment: { courier: "Royal Mail", trackingNo: "RM123GB" } });
    expect(saved.statusHistory.map((h) => h.status)).toEqual(["pending", "confirmed", "processing", "shipped", "delivered"]);
    expect(String(saved.statusHistory.at(-1)!.by)).toBe(admin.id);
  });

  it("cancelling after confirmation restores stock and coupon use exactly once", async () => {
    await CouponModel.create({ code: "TEN", type: "fixed", value: 10, minOrder: 0, expiresAt: new Date(Date.now() + 864e5) });
    const { order: o, m } = await order({ couponCode: "TEN" });
    expect(await stockOf(m._id)).toBe(1);
    const res = await transitionOrder(o.orderNo, { to: "cancelled" }, admin);
    expect(res.stockRestored).toBe(true);
    expect(await stockOf(m._id)).toBe(3);
    expect((await CouponModel.findOne({ code: "TEN" }).lean())!.usedCount).toBe(0);
    expect((await OrderModel.findOne({ orderNo: o.orderNo }).lean())!.cancelledBy).toBe("admin");
  });

  it("returned orders restock only when asked; refunds need a paid order", async () => {
    const { order: o, m } = await order();
    await transitionOrder(o.orderNo, { to: "shipped", courier: "DPD" }, admin);
    await transitionOrder(o.orderNo, { to: "delivered" }, admin);
    await transitionOrder(o.orderNo, { to: "returned", restock: true }, admin);
    expect(await stockOf(m._id)).toBe(3);
    await transitionOrder(o.orderNo, { to: "refunded" }, admin);
    expect((await OrderModel.findOne({ orderNo: o.orderNo }).lean())!.paymentStatus).toBe("refunded");

    const { token } = await addItem(undefined, String(m._id), 1);
    const { order: unpaid } = await placeOrder({ cartToken: token, contact, address, deliveryOption: ZONE, paymentMethod: "stripe" }, rules);
    await transitionOrder(unpaid.orderNo, { to: "cancelled" }, admin);
    await expect(transitionOrder(unpaid.orderNo, { to: "refunded" }, admin)).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("product editor", () => {
  async function input(over: Partial<ProductData> = {}): Promise<ProductData> {
    const { category, product } = await seedProduct();
    const variants = await VariantModel.find({ product: product._id }).sort({ sku: -1 }).lean(); // M, L
    return {
      id: String(product._id), name: "Test Oxford Shirt", slug: "test-oxford-shirt", skuBase: "OV-TST-001", category: String(category._id), collections: [], tags: [],
      description: "", fabric: "Cotton", careNotes: "", price: 1000, salePrice: undefined, status: "active", sizeType: "alpha", seoTitle: "", seoDescription: "", images: [],
      variants: variants.map((v) => ({ id: String(v._id), sku: v.sku, size: v.size, colour: v.colour, colourHex: "", stock: v.stock, priceOverride: undefined, isActive: true })),
      ...over,
    };
  }

  it("updates prices, removes a sale price, adds a variant with an automatic SKU and keeps filters in sync", async () => {
    const data = await input();
    data.variants.push({ sku: "", size: "XL", colour: "White", colourHex: "", stock: 4, priceOverride: undefined, isActive: true });
    const res = await saveProduct(data);
    const p = (await ProductModel.findById(data.id).lean())!;
    expect(p.salePrice).toBeUndefined();
    expect(p.minPrice).toBe(1000);
    expect(p.sizes).toEqual(["M", "L", "XL"]);
    expect(res.variants[2].sku).toBe("OV-TST-001-WHI-XL");
    expect(res.changes.salePrice).toEqual({ from: 800, to: null });
    // Saving again with the returned ids updates rather than duplicates.
    data.variants[2] = { ...data.variants[2], id: res.variants[2].id, sku: res.variants[2].sku, stock: 6 };
    await saveProduct(data);
    expect(await VariantModel.countDocuments({ product: data.id })).toBe(3);
  });

  it("deletes removed variants, but only deactivates ones that were ordered", async () => {
    const { product, category, l } = await order(); // the order uses size M
    await saveProduct({
      id: String(product._id), name: product.name, slug: product.slug, skuBase: product.skuBase, category: String(category._id), collections: [], tags: [],
      description: "", fabric: "", careNotes: "", price: 1000, salePrice: 800, status: "active", sizeType: "alpha", seoTitle: "", seoDescription: "", images: [],
      variants: [{ sku: "", size: "S", colour: "White", colourHex: "", stock: 2, priceOverride: undefined, isActive: true }],
    });
    expect(await VariantModel.exists({ _id: l._id })).toBeNull();
    expect((await VariantModel.findOne({ sku: "OV-TST-001-WHI-M" }).lean())!.isActive).toBe(false);
    expect((await ProductModel.findById(product._id).lean())!.sizes).toEqual(["S"]);
  });

  it("rejects a SKU already used by another product", async () => {
    const data = await input();
    const other = await ProductModel.create({ name: "Other", slug: "other", skuBase: "OV-OTH-001", category: data.category, price: 500, sizeType: "alpha" });
    await VariantModel.create({ product: other._id, sku: "TAKEN-SKU", size: "M", colour: "Blue", stock: 1 });
    data.variants[0].sku = "TAKEN-SKU";
    await expect(saveProduct(data)).rejects.toThrow(/TAKEN-SKU/);
  });

  it("keeps collection membership in sync both ways", async () => {
    const data = await input();
    const c = await CollectionModel.create({ name: "Best Sellers", slug: "best-sellers" });
    await saveProduct({ ...data, collections: [String(c._id)] });
    expect((await CollectionModel.findById(c._id).lean())!.products.map(String)).toEqual([data.id]);
    await saveProduct({ ...data, collections: [] });
    expect((await CollectionModel.findById(c._id).lean())!.products).toEqual([]);
  });

  it("duplicates as a draft with new SKUs and no stock", async () => {
    const { product } = await seedProduct();
    const copy = await duplicateProduct(String(product._id));
    const p = (await ProductModel.findById(copy.id).lean())!;
    expect(p).toMatchObject({ status: "draft", slug: "test-oxford-shirt-copy", skuBase: "OV-TST-001-C2" });
    const variants = await VariantModel.find({ product: copy.id }).lean();
    expect(variants.map((v) => v.sku).sort()).toEqual(["OV-TST-001-C2-WHI-L", "OV-TST-001-C2-WHI-M"]);
    expect(variants.every((v) => v.stock === 0)).toBe(true);
  });
});

describe("dashboard, filters, customers, CSV", () => {
  it("counts sales by UK day, excludes cancelled orders and flags unpaid checkouts", async () => {
    const { order: a } = await order({ paid: false, qty: 1 });
    await OrderModel.create({ ...a, _id: undefined, orderNo: "OV-X-1", status: "cancelled", statusHistory: [] });
    const d = await getDashboard(5);
    expect(d.today).toEqual({ revenue: a.total, orders: 1 });
    expect(d.chart).toHaveLength(30);
    expect(d.chart.at(-1)!.revenue).toBe(a.total);
    expect(d.attention.pending).toBe(1);
    expect(d.attention.awaitingPayment).toBe(1);
    expect(d.lowStock.map((v) => v.sku)).toContain("OV-TST-001-WHI-L");
  });

  it("builds order filters from query params and ignores junk", () => {
    expect(orderFilter({ status: "pending,bogus", payment: "awaiting", method: "paypal" })).toMatchObject({
      status: { $in: ["pending"] }, paymentMethod: "paypal", paymentStatus: { $in: ["unpaid", "failed"] },
    });
    expect(orderFilter({ method: "cod" })).toEqual({});
    expect(orderFilter({ status: "nope", payment: "x", from: "2026-13-99x" })).toEqual({});
  });

  it("groups customers by phone with spend excluding cancelled orders", async () => {
    const { order: a } = await order({ paid: false, qty: 1 });
    await OrderModel.create({ ...a, _id: undefined, orderNo: "OV-X-2", status: "cancelled" });
    const { rows, total } = await listCustomers({});
    expect(total).toBe(1);
    expect(rows[0]).toMatchObject({ phone: contact.phone, orders: 2, spent: a.total });
  });

  it("escapes CSV and blocks spreadsheet formulas", () => {
    const csv = toCsv(["a", "b"], [["=SUM(1)", 'He said "hi", ok']]);
    expect(csv).toBe('﻿a,b\r\n\'=SUM(1),"He said ""hi"", ok"');
  });
});
