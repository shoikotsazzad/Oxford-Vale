// Pure price calculation. No database, no I/O: everything is passed in, so it is easy to test.
// All amounts are whole cents (USD). The client never sends prices; callers load them from the DB.

export type PriceSource = { price: number; salePrice?: number | null };
export type VariantPriceSource = { priceOverride?: number | null };

/** Unit price: variant override → product sale price → product price. */
export function unitPriceOf(product: PriceSource, variant: VariantPriceSource = {}): number {
  return variant.priceOverride ?? product.salePrice ?? product.price;
}

export type CouponRule = { type: "percent" | "fixed"; value: number; maxDiscount?: number | null };

/** Discount for a subtotal: percent is rounded down to whole cents and capped; fixed never exceeds the subtotal. */
export function couponDiscount(coupon: CouponRule | null | undefined, subtotal: number): number {
  if (!coupon || subtotal <= 0) return 0;
  let d = coupon.type === "percent" ? Math.floor((subtotal * Math.min(coupon.value, 100)) / 100) : Math.floor(coupon.value);
  if (coupon.type === "percent" && coupon.maxDiscount != null && coupon.maxDiscount > 0) d = Math.min(d, coupon.maxDiscount);
  return Math.max(0, Math.min(d, subtotal));
}

export type PricingInput = {
  lines: { unitPrice: number; qty: number }[];
  coupon?: CouponRule | null;
  /** Zone fee, or null when no address/zone is known yet. */
  deliveryFee?: number | null;
  freeDeliveryThreshold?: number;
};

export type Totals = {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  freeDelivery: boolean;
  /** Amount still needed for free delivery (0 when reached or disabled). */
  freeDeliveryGap: number;
  total: number;
};

export function computeTotals({ lines, coupon, deliveryFee = null, freeDeliveryThreshold = 0 }: PricingInput): Totals {
  for (const l of lines) {
    if (!Number.isInteger(l.unitPrice) || l.unitPrice < 0 || !Number.isInteger(l.qty) || l.qty < 1) throw new Error("Invalid cart line");
  }
  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.qty, 0);
  const discount = couponDiscount(coupon, subtotal);
  const afterDiscount = subtotal - discount;
  const freeDelivery = freeDeliveryThreshold > 0 && afterDiscount >= freeDeliveryThreshold;
  const fee = deliveryFee == null || freeDelivery ? 0 : deliveryFee;
  return {
    subtotal,
    discount,
    deliveryFee: fee,
    freeDelivery,
    freeDeliveryGap: freeDeliveryThreshold > 0 ? Math.max(0, freeDeliveryThreshold - afterDiscount) : 0,
    total: afterDiscount + fee,
  };
}
