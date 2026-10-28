import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CartModel, CouponModel, LeadModel, OrderModel, ProductModel, VariantModel } from "@/models";
import { addItem } from "@/server/services/cart";
import { cancelOrder, nextOrderNo, OrderError, placeOrder, type StoreRules } from "@/server/services/order";
import { confirmSslPayment } from "@/server/services/payment-callbacks";
import { mockValId } from "@/server/adapters/payments/sslcommerz";
import { clearDb, startDb, stopDb } from "./helpers/db";
import { seedProduct } from "./helpers/fixtures";

process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-123";
process.env.SSLCOMMERZ_MODE = "mock";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

const rules: StoreRules = {
  zones: [
    { id: "000000000000000000000001", name: "Dhaka City", fee: 80, etaMinDays: 1, etaMaxDays: 2, match: { divisions: [], districts: [], areas: ["Gulshan"] } },
    { id: "000000000000000000000002", name: "Rest of Bangladesh", fee: 150, etaMinDays: 3, etaMaxDays: 5, match: { divisions: [], districts: [], areas: [] } },
  ],
  freeDeliveryThreshold: 10000,
  payments: { cod: true, sslcommerz: true, bkash: { enabled: true }, nagad: { enabled: false } },
};
const contact = { name: "Test Customer", phone: "01700000009", email: "test@example.com" };
const address = { name: "Test Customer", phone: "01700000009", division: "Dhaka", district: "Dhaka", upazila: "Gulshan", addressLine: "House 1, Road 2" };

async function cartWith(qty = 2) {
  const fx = await seedProduct();
  const { token } = await addItem(undefined, String(fx.m._id), qty);
  return { ...fx, token };
}

describe("placeOrder", () => {
  it("creates an order with server-side totals, reserves stock and converts cart + lead", async () => {
    const { token, m, product } = await cartWith(2);
    const { order } = await placeOrder({ cartToken: token, contact, address, paymentMethod: "cod" }, rules);

    expect(order.orderNo).toMatch(/^OV-\d{6}-\d{4}$/);
    expect(order).toMatchObject({ subtotal: 1600, discount: 0, total: 1680, status: "pending", paymentStatus: "unpaid", paymentMethod: "cod" });
    expect(order.delivery).toMatchObject({ name: "Dhaka City", fee: 80 });
    expect(order.items[0]).toMatchObject({ sku: "OV-TST-001-WHI-M", unitPrice: 800, regularPrice: 1000, qty: 2, lineTotal: 1600 });
    expect((await VariantModel.findById(m._id).lean())!.stock).toBe(1);
    expect((await CartModel.findOne({ cartToken: token }).lean())!.status).toBe("converted");
    expect(await LeadModel.findById(order.lead).lean()).toMatchObject({ status: "converted", phone: contact.phone, source: "checkout" });
    expect((await ProductModel.findById(product._id).lean())!.inStock).toBe(true);
  });

  it("uses the database price even if it changed after adding to the bag", async () => {
    const { token, product } = await cartWith(1);
    await ProductModel.updateOne({ _id: product._id }, { salePrice: 500 });
    const { order } = await placeOrder({ cartToken: token, contact, address, paymentMethod: "cod" }, rules);
    expect(order.subtotal).toBe(500);
  });

  it("applies a coupon and counts its use", async () => {
    const { token } = await cartWith(2);
    await CouponModel.create({ code: "FLAT100", type: "fixed", value: 100, minOrder: 1000, expiresAt: new Date(Date.now() + 864e5), usageLimit: 1 });
    const { order } = await placeOrder({ cartToken: token, contact, address, paymentMethod: "cod", couponCode: "flat100" }, rules);
    expect(order).toMatchObject({ couponCode: "FLAT100", discount: 100, total: 1600 - 100 + 80 });
    expect((await CouponModel.findOne({ code: "FLAT100" }).lean())!.usedCount).toBe(1);
  });

  it("rejects an invalid coupon without touching stock", async () => {
    const { token, m } = await cartWith(2);
    await expect(placeOrder({ cartToken: token, contact, address, paymentMethod: "cod", couponCode: "NOPE" }, rules)).rejects.toMatchObject({ code: "VALIDATION" });
    expect((await VariantModel.findById(m._id).lean())!.stock).toBe(3);
  });

  it("refuses when stock ran out after adding, and asks to review the bag", async () => {
    const { token, m } = await cartWith(2);
    await VariantModel.updateOne({ _id: m._id }, { stock: 1 });
    await expect(placeOrder({ cartToken: token, contact, address, paymentMethod: "cod" }, rules)).rejects.toMatchObject({ code: "CONFLICT" });
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
      await expect(placeOrder({ cartToken: token, contact, address, paymentMethod: "cod" }, rules)).rejects.toMatchObject({ code: "OUT_OF_STOCK" });
    } finally {
      VariantModel.updateOne = original;
    }
    expect((await VariantModel.findById(m._id).lean())!.stock).toBe(3);
    expect(await OrderModel.countDocuments()).toBe(0);
  });

  it("gives free delivery over the threshold", async () => {
    const { token, product } = await cartWith(2);
    await ProductModel.updateOne({ _id: product._id }, { salePrice: 6000 });
    const { order } = await placeOrder({ cartToken: token, contact, address: { ...address, upazila: "Savar" }, paymentMethod: "cod" }, rules);
    expect(order.delivery).toMatchObject({ name: "Rest of Bangladesh", fee: 0 });
    expect(order.total).toBe(12000);
  });

  it("rejects a disabled payment method and an empty bag", async () => {
    const { token } = await cartWith(1);
    await expect(placeOrder({ cartToken: token, contact, address, paymentMethod: "nagad" }, rules)).rejects.toBeInstanceOf(OrderError);
    await expect(placeOrder({ cartToken: "missing", contact, address, paymentMethod: "cod" }, rules)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("numbers orders sequentially per day", async () => {
    const day = new Date("2026-10-22T10:00:00Z");
    expect(await nextOrderNo(day)).toBe("OV-261022-0001");
    expect(await nextOrderNo(day)).toBe("OV-261022-0002");
  });
});

describe("cancelOrder", () => {
  it("restores stock and coupon use once, only while pending", async () => {
    const { token, m } = await cartWith(2);
    await CouponModel.create({ code: "FLAT100", type: "fixed", value: 100, minOrder: 0, expiresAt: new Date(Date.now() + 864e5) });
    const { order } = await placeOrder({ cartToken: token, contact, address, paymentMethod: "cod", couponCode: "FLAT100" }, rules);
    await cancelOrder(order.orderNo, "customer");
    expect((await VariantModel.findById(m._id).lean())!.stock).toBe(3);
    expect((await CouponModel.findOne({ code: "FLAT100" }).lean())!.usedCount).toBe(0);
    await expect(cancelOrder(order.orderNo, "customer")).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await VariantModel.findById(m._id).lean())!.stock).toBe(3);
  });
});

describe("SSLCommerz callbacks (mock mode)", () => {
  it("marks the order paid and confirmed after validation", async () => {
    const { token } = await cartWith(1);
    const { order } = await placeOrder({ cartToken: token, contact, address, paymentMethod: "sslcommerz" }, rules);
    const res = await confirmSslPayment({ tran_id: order.orderNo, val_id: mockValId(order.orderNo, order.total), amount: String(order.total) });
    expect(res.ok).toBe(true);
    expect(await OrderModel.findOne({ orderNo: order.orderNo }).lean()).toMatchObject({ paymentStatus: "paid", status: "confirmed" });
  });

  it("rejects a forged validation id", async () => {
    const { token } = await cartWith(1);
    const { order } = await placeOrder({ cartToken: token, contact, address, paymentMethod: "sslcommerz" }, rules);
    const res = await confirmSslPayment({ tran_id: order.orderNo, val_id: "mock-forged", amount: String(order.total) });
    expect(res.ok).toBe(false);
    expect((await OrderModel.findOne({ orderNo: order.orderNo }).lean())!.paymentStatus).toBe("unpaid");
  });

  it("fails the payment when the paid amount doesn't match the order", async () => {
    const { token } = await cartWith(1);
    const { order } = await placeOrder({ cartToken: token, contact, address, paymentMethod: "sslcommerz" }, rules);
    const res = await confirmSslPayment({ tran_id: order.orderNo, val_id: mockValId(order.orderNo, 1), amount: "1" });
    expect(res.ok).toBe(false);
    expect((await OrderModel.findOne({ orderNo: order.orderNo }).lean())!.paymentStatus).toBe("failed");
  });
});
