import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CouponModel, OrderModel } from "@/models";
import { claimCoupon, CouponError, releaseCoupon, validateCoupon } from "@/server/services/coupon";
import { clearDb, startDb, stopDb } from "./helpers/db";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

const future = new Date(Date.now() + 864e5);
const make = (over: Record<string, unknown> = {}) =>
  CouponModel.create({ code: "TEST10", type: "percent", value: 10, minOrder: 3000, expiresAt: future, usageLimit: 0, perCustomerLimit: 0, ...over });

describe("validateCoupon", () => {
  it("accepts a valid code case-insensitively", async () => {
    await make();
    const c = await validateCoupon(" test10 ", { subtotal: 5000 });
    expect(c.code).toBe("TEST10");
    expect(c.type).toBe("percent");
  });

  it.each([
    ["unknown code", {}, "NOPE", 5000, /isn't valid/],
    ["inactive", { isActive: false }, "TEST10", 5000, /isn't valid/],
    ["expired", { expiresAt: new Date(Date.now() - 1000) }, "TEST10", 5000, /expired/],
    ["not started", { startsAt: future }, "TEST10", 5000, /isn't active yet/],
    ["below minimum", {}, "TEST10", 2999, /at least \$30/],
    ["usage limit reached", { usageLimit: 5, usedCount: 5 }, "TEST10", 5000, /usage limit/],
  ])("rejects %s", async (_label, over, code, subtotal, message) => {
    await make(over);
    await expect(validateCoupon(code as string, { subtotal: subtotal as number })).rejects.toThrow(message as RegExp);
  });

  it("enforces the per-customer limit by phone, ignoring cancelled orders", async () => {
    await make({ perCustomerLimit: 1 });
    const base = {
      couponCode: "TEST10", customer: { name: "A", phone: "07700900009" }, items: [{ product: "6ad999a83bc545b1f88fb120", variant: "6ad999a83bc545b1f88fb121", sku: "X", name: "X", regularPrice: 1, unitPrice: 1, qty: 1, lineTotal: 1 }],
      shippingAddress: { name: "A", phone: "07700900009", line1: "1 Test Street", city: "London", postcode: "W1S 3PR", country: "GB" },
      subtotal: 1, total: 1, paymentMethod: "stripe" as const,
    };
    await OrderModel.create({ ...base, orderNo: "OV-000000-0001", status: "cancelled" });
    await expect(validateCoupon("TEST10", { subtotal: 5000, phone: "07700900009" })).resolves.toBeTruthy();
    await OrderModel.create({ ...base, orderNo: "OV-000000-0002" });
    await expect(validateCoupon("TEST10", { subtotal: 5000, phone: "07700900009" })).rejects.toBeInstanceOf(CouponError);
    await expect(validateCoupon("TEST10", { subtotal: 5000, phone: "01800000009" })).resolves.toBeTruthy();
  });
});

describe("claimCoupon", () => {
  it("counts uses atomically up to the limit and can release them", async () => {
    await make({ usageLimit: 2 });
    const results = await Promise.all([claimCoupon("TEST10"), claimCoupon("TEST10"), claimCoupon("TEST10")]);
    expect(results.filter(Boolean)).toHaveLength(2);
    await releaseCoupon("TEST10");
    expect((await CouponModel.findOne({ code: "TEST10" }).lean())!.usedCount).toBe(1);
  });
  it("is unlimited when usageLimit is 0", async () => {
    await make({ usageLimit: 0 });
    for (let i = 0; i < 5; i++) expect(await claimCoupon("TEST10")).toBe(true);
  });
});
