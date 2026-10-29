import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CartModel, CouponModel, LeadModel, OrderModel, ProductModel, VariantModel } from "@/models";
import { addItem } from "@/server/services/cart";
import { cancelOrder, nextOrderNo, OrderError, placeOrder, type StoreRules } from "@/server/services/order";
import { createHmac } from "node:crypto";
import { applyPayment } from "@/server/services/payment-callbacks";
import { confirmMock, mockSig, stripe } from "@/server/adapters/payments";
import { clearDb, startDb, stopDb } from "./helpers/db";
import { seedProduct } from "./helpers/fixtures";

process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-123";
delete process.env.STRIPE_SECRET_KEY; // mock mode
delete process.env.PAYPAL_CLIENT_ID;

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

// Amounts in cents. The fixture product costs $10 ($8 on sale).
const STANDARD = "000000000000000000000001";
const NEXT_DAY = "000000000000000000000002";
const WORLD = "000000000000000000000003";
const rules: StoreRules = {
  zones: [
    { id: STANDARD, name: "UK Standard", fee: 595, etaMinDays: 3, etaMaxDays: 5, countries: ["GB"], freeEligible: true, note: "" },
    { id: NEXT_DAY, name: "UK Next day", fee: 895, etaMinDays: 1, etaMaxDays: 1, countries: ["GB"], freeEligible: false, note: "Order before 2 pm" },
    { id: WORLD, name: "Rest of the world", fee: 3495, etaMinDays: 7, etaMaxDays: 14, countries: [], freeEligible: false, note: "" },
  ],
  freeDeliveryThreshold: 12500,
  payments: { stripe: true, paypal: false },
};
const contact = { name: "Test Customer", phone: "07700900009", email: "test@example.com" };
const address = { name: "Test Customer", phone: "07700900009", line1: "14 Test Street", line2: "", city: "London", county: "", postcode: "W1S 3PR", country: "GB" };
const order0 = (token: string | undefined, extra: Record<string, unknown> = {}) =>
  ({ cartToken: token, contact, address, deliveryOption: STANDARD, paymentMethod: "stripe" as const, ...extra });

async function cartWith(qty = 2) {
  const fx = await seedProduct();
  const { token } = await addItem(undefined, String(fx.m._id), qty);
  return { ...fx, token };
}

describe("placeOrder", () => {
  it("creates an order with server-side totals, reserves stock and converts cart + lead", async () => {
    const { token, m, product } = await cartWith(2);
    const { order } = await placeOrder(order0(token), rules);

    expect(order.orderNo).toMatch(/^OV-\d{6}-\d{4}$/);
    expect(order).toMatchObject({ subtotal: 1600, discount: 0, total: 1600 + 595, status: "pending", paymentStatus: "unpaid", paymentMethod: "stripe" });
    expect(order.delivery).toMatchObject({ name: "UK Standard", fee: 595 });
    expect(order.shippingAddress).toMatchObject({ line1: "14 Test Street", postcode: "W1S 3PR", country: "GB" });
    expect(order.items[0]).toMatchObject({ sku: "OV-TST-001-WHI-M", unitPrice: 800, regularPrice: 1000, qty: 2, lineTotal: 1600 });
    expect((await VariantModel.findById(m._id).lean())!.stock).toBe(1);
    expect((await CartModel.findOne({ cartToken: token }).lean())!.status).toBe("converted");
    expect(await LeadModel.findById(order.lead).lean()).toMatchObject({ status: "converted", phone: contact.phone, source: "checkout" });
    expect((await ProductModel.findById(product._id).lean())!.inStock).toBe(true);
  });

  it("uses the database price even if it changed after adding to the bag", async () => {
    const { token, product } = await cartWith(1);
    await ProductModel.updateOne({ _id: product._id }, { salePrice: 500 });
    const { order } = await placeOrder(order0(token), rules);
    expect(order.subtotal).toBe(500);
  });

  it("applies a coupon and counts its use", async () => {
    const { token } = await cartWith(2);
    await CouponModel.create({ code: "FLAT100", type: "fixed", value: 100, minOrder: 1000, expiresAt: new Date(Date.now() + 864e5), usageLimit: 1 });
    const { order } = await placeOrder(order0(token, { couponCode: "flat100" }), rules);
    expect(order).toMatchObject({ couponCode: "FLAT100", discount: 100, total: 1600 - 100 + 595 });
    expect((await CouponModel.findOne({ code: "FLAT100" }).lean())!.usedCount).toBe(1);
  });

  it("rejects an invalid coupon without touching stock", async () => {
    const { token, m } = await cartWith(2);
    await expect(placeOrder(order0(token, { couponCode: "NOPE" }), rules)).rejects.toMatchObject({ code: "VALIDATION" });
    expect((await VariantModel.findById(m._id).lean())!.stock).toBe(3);
  });

  it("refuses when stock ran out after adding, and asks to review the bag", async () => {
    const { token, m } = await cartWith(2);
    await VariantModel.updateOne({ _id: m._id }, { stock: 1 });
    await expect(placeOrder(order0(token), rules)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await OrderModel.countDocuments()).toBe(0);
  });

  it("rolls back earlier lines when a later line can't be reserved", async () => {
    const { token, m, product } = await cartWith(1);
    const other = await VariantModel.create({ product: product._id, sku: "OV-TST-001-WHI-S", size: "S", colour: "White", stock: 1 });
    await addItem(token, String(other._id), 1);
    // Someone else buys the last S between the bag check and the reservation.
    const original = VariantModel.updateOne.bind(VariantModel);
    let calls = 0;
    VariantModel.updateOne = ((filter: Record<string, unknown>, update: Record<string, unknown>) => {
      if (String(filter._id) === String(other._id) && calls++ === 0) return original({ _id: other._id }, { stock: 0 }).then(() => original(filter, update));
      return original(filter, update);
    }) as typeof VariantModel.updateOne;
    try {
      await expect(placeOrder(order0(token), rules)).rejects.toMatchObject({ code: "OUT_OF_STOCK" });
    } finally {
      VariantModel.updateOne = original;
    }
    expect((await VariantModel.findById(m._id).lean())!.stock).toBe(3);
    expect(await OrderModel.countDocuments()).toBe(0);
  });

  it("gives free delivery over the threshold, only on eligible options", async () => {
    const { token, product } = await cartWith(2);
    await ProductModel.updateOne({ _id: product._id }, { salePrice: 6500 });
    const { order } = await placeOrder(order0(token), rules);
    expect(order.delivery).toMatchObject({ name: "UK Standard", fee: 0 });
    expect(order.total).toBe(13000);
  });

  it("charges next-day delivery even over the threshold", async () => {
    const { token, product } = await cartWith(2);
    await ProductModel.updateOne({ _id: product._id }, { salePrice: 6500 });
    const { order } = await placeOrder(order0(token, { deliveryOption: NEXT_DAY }), rules);
    expect(order.delivery).toMatchObject({ name: "UK Next day", fee: 895 });
  });

  it("uses the rest-of-world option abroad and rejects an option not offered for the country", async () => {
    const { token } = await cartWith(1);
    const us = { ...address, country: "US", postcode: "10014", city: "New York" };
    await expect(placeOrder(order0(token, { address: us, deliveryOption: STANDARD }), rules)).rejects.toMatchObject({ code: "VALIDATION" });
    const { order } = await placeOrder(order0(token, { address: us, deliveryOption: WORLD }), rules);
    expect(order.delivery).toMatchObject({ name: "Rest of the world", fee: 3495 });
  });

  it("rejects a disabled payment method and an empty bag", async () => {
    const { token } = await cartWith(1);
    await expect(placeOrder(order0(token, { paymentMethod: "paypal" }), rules)).rejects.toBeInstanceOf(OrderError);
    await expect(placeOrder(order0("missing"), rules)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("numbers orders sequentially per UK day", async () => {
    const day = new Date("2026-10-22T10:00:00Z");
    expect(await nextOrderNo(day)).toBe("OV-261022-0001");
    expect(await nextOrderNo(day)).toBe("OV-261022-0002");
    // 23:30 UTC in July is already the next day in London (BST).
    expect(await nextOrderNo(new Date("2026-07-15T23:30:00Z"))).toBe("OV-260716-0001");
  });
});

describe("cancelOrder", () => {
  it("restores stock and coupon use once, only while pending", async () => {
    const { token, m } = await cartWith(2);
    await CouponModel.create({ code: "FLAT100", type: "fixed", value: 100, minOrder: 0, expiresAt: new Date(Date.now() + 864e5) });
    const { order } = await placeOrder(order0(token, { couponCode: "FLAT100" }), rules);
    await cancelOrder(order.orderNo, "customer");
    expect((await VariantModel.findById(m._id).lean())!.stock).toBe(3);
    expect((await CouponModel.findOne({ code: "FLAT100" }).lean())!.usedCount).toBe(0);
    await expect(cancelOrder(order.orderNo, "customer")).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await VariantModel.findById(m._id).lean())!.stock).toBe(3);
  });
});

describe("online payments", () => {
  const paidLink = (orderNo: string, amount: number) => mockSig("paid", "stripe", orderNo, amount);

  it("marks the order paid and confirmed once, after the mock payment", async () => {
    const { token } = await cartWith(1);
    const { order } = await placeOrder(order0(token), rules);
    const first = await applyPayment("stripe", confirmMock("stripe", order.orderNo, order.total, paidLink(order.orderNo, order.total)));
    expect(first).toMatchObject({ ok: true, newlyPaid: true });
    expect(await OrderModel.findOne({ orderNo: order.orderNo }).lean()).toMatchObject({ paymentStatus: "paid", status: "confirmed", payment: { brand: "Mock card" } });
    // The return redirect and the webhook can both arrive: the second one changes nothing.
    const second = await applyPayment("stripe", confirmMock("stripe", order.orderNo, order.total, paidLink(order.orderNo, order.total)));
    expect(second).toMatchObject({ ok: true, newlyPaid: false });
  });

  it("rejects a forged or edited mock link", async () => {
    const { token } = await cartWith(1);
    const { order } = await placeOrder(order0(token), rules);
    expect(confirmMock("stripe", order.orderNo, order.total, "forged").ok).toBe(false);
    expect(confirmMock("stripe", order.orderNo, 1, paidLink(order.orderNo, order.total)).ok).toBe(false);
    expect((await OrderModel.findOne({ orderNo: order.orderNo }).lean())!.paymentStatus).toBe("unpaid");
  });

  it("fails the payment when the amount or currency doesn't match the order", async () => {
    const { token } = await cartWith(1);
    const { order } = await placeOrder(order0(token), rules);
    const res = await applyPayment("stripe", { ok: true, orderNo: order.orderNo, amount: 1, currency: "USD", sessionId: "cs_x", gatewayTranId: "pi_x", brand: "card" });
    expect(res.ok).toBe(false);
    expect((await OrderModel.findOne({ orderNo: order.orderNo }).lean())!.paymentStatus).toBe("failed");
    const gbp = await applyPayment("stripe", { ok: true, orderNo: order.orderNo, amount: order.total, currency: "GBP", sessionId: "cs_x", gatewayTranId: "pi_x", brand: "card" });
    expect(gbp.ok).toBe(false);
  });
});

describe("Stripe webhook signature", () => {
  const secret = "whsec_test";
  const sign = (body: string, t: number) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;

  it("accepts a valid signature and rejects tampering, old timestamps and a missing secret", () => {
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    const body = JSON.stringify({ type: "checkout.session.completed" });
    const now = Date.now();
    const t = Math.floor(now / 1000);
    expect(stripe.verifyWebhook(body, sign(body, t), now)).toBe(true);
    expect(stripe.verifyWebhook(body + " ", sign(body, t), now)).toBe(false);
    expect(stripe.verifyWebhook(body, sign(body, t - 600), now)).toBe(false);
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect(stripe.verifyWebhook(body, sign(body, t), now)).toBe(false);
  });
});
