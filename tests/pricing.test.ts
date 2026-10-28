import { describe, expect, it } from "vitest";
import { computeTotals, couponDiscount, unitPriceOf } from "@/server/services/pricing";

describe("unitPriceOf", () => {
  it("prefers variant override, then sale price, then price", () => {
    expect(unitPriceOf({ price: 1000 })).toBe(1000);
    expect(unitPriceOf({ price: 1000, salePrice: 800 })).toBe(800);
    expect(unitPriceOf({ price: 1000, salePrice: 800 }, { priceOverride: 900 })).toBe(900);
    expect(unitPriceOf({ price: 1000, salePrice: null }, { priceOverride: null })).toBe(1000);
  });
});

describe("couponDiscount", () => {
  it("rounds percent discounts down to whole taka", () => {
    expect(couponDiscount({ type: "percent", value: 10 }, 3335)).toBe(333);
  });
  it("caps percent discounts at maxDiscount", () => {
    expect(couponDiscount({ type: "percent", value: 20, maxDiscount: 1000 }, 20000)).toBe(1000);
  });
  it("never discounts more than the subtotal", () => {
    expect(couponDiscount({ type: "fixed", value: 500 }, 300)).toBe(300);
    expect(couponDiscount({ type: "percent", value: 150 }, 300)).toBe(300);
  });
  it("returns 0 without a coupon or subtotal", () => {
    expect(couponDiscount(null, 5000)).toBe(0);
    expect(couponDiscount({ type: "fixed", value: 500 }, 0)).toBe(0);
  });
});

describe("computeTotals", () => {
  const lines = [{ unitPrice: 2200, qty: 2 }, { unitPrice: 4800, qty: 1 }]; // 9,200

  it("sums lines and adds the delivery fee", () => {
    expect(computeTotals({ lines, deliveryFee: 80, freeDeliveryThreshold: 10000 })).toEqual({
      subtotal: 9200, discount: 0, deliveryFee: 80, freeDelivery: false, freeDeliveryGap: 800, total: 9280,
    });
  });

  it("gives free delivery at the threshold", () => {
    const t = computeTotals({ lines: [{ unitPrice: 10000, qty: 1 }], deliveryFee: 150, freeDeliveryThreshold: 10000 });
    expect(t.freeDelivery).toBe(true);
    expect(t.deliveryFee).toBe(0);
    expect(t.total).toBe(10000);
  });

  it("checks the free-delivery threshold after the discount", () => {
    const t = computeTotals({ lines: [{ unitPrice: 10500, qty: 1 }], coupon: { type: "fixed", value: 1000 }, deliveryFee: 120, freeDeliveryThreshold: 10000 });
    expect(t.discount).toBe(1000);
    expect(t.freeDelivery).toBe(false);
    expect(t.total).toBe(9500 + 120);
  });

  it("treats an unknown zone as no fee yet", () => {
    expect(computeTotals({ lines, deliveryFee: null }).deliveryFee).toBe(0);
  });

  it("rejects invalid lines", () => {
    expect(() => computeTotals({ lines: [{ unitPrice: 100, qty: 0 }] })).toThrow();
    expect(() => computeTotals({ lines: [{ unitPrice: 99.5, qty: 1 }] })).toThrow();
  });
});
