import { formatMoney } from "@/lib/money";
import type { Types } from "mongoose";
import { CouponModel, OrderModel, type Coupon } from "@/models";
import { connectDB } from "@/server/db";
import type { CouponRule } from "./pricing";

export class CouponError extends Error {}

type CouponDoc = Coupon & { _id: Types.ObjectId };

/** Checks a code against dates, minimum order, usage limit and per-customer limit. Throws CouponError with a shopper-friendly message. */
export async function validateCoupon(rawCode: string, ctx: { subtotal: number; phone?: string; now?: Date }): Promise<CouponDoc & CouponRule> {
  const code = rawCode.trim().toUpperCase();
  const now = ctx.now ?? new Date();
  const coupon = await CouponModel.findOne({ code }).lean<CouponDoc>();
  if (!coupon || !coupon.isActive) throw new CouponError("This coupon code isn't valid.");
  if (coupon.startsAt && coupon.startsAt > now) throw new CouponError("This coupon isn't active yet.");
  if (coupon.expiresAt <= now) throw new CouponError("This coupon has expired.");
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) throw new CouponError("This coupon has reached its usage limit.");
  if (ctx.subtotal < coupon.minOrder) throw new CouponError(`Spend at least ${formatMoney(coupon.minOrder)} to use this coupon.`);
  if (coupon.perCustomerLimit > 0 && ctx.phone) {
    const used = await OrderModel.countDocuments({ couponCode: code, "customer.phone": ctx.phone, status: { $nin: ["cancelled"] } });
    if (used >= coupon.perCustomerLimit) throw new CouponError("You've already used this coupon.");
  }
  return { ...coupon, type: coupon.type, value: coupon.value, maxDiscount: coupon.maxDiscount };
}

/** Atomically count one use; false when the limit was reached in the meantime. */
export async function claimCoupon(code: string): Promise<boolean> {
  const res = await CouponModel.updateOne(
    { code, isActive: true, $or: [{ usageLimit: 0 }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }] },
    { $inc: { usedCount: 1 } },
  );
  return res.modifiedCount === 1;
}

export async function releaseCoupon(code: string) {
  await CouponModel.updateOne({ code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
}

export type PublicOffer = { code: string; headline: string; text: string };

/** A coupon to advertise on the home page, only while a shopper could actually use it. */
export async function getPublicOffer(rawCode: string, now = new Date()): Promise<PublicOffer | null> {
  const code = rawCode.trim().toUpperCase();
  await connectDB();
  const c = await CouponModel.findOne({ code, isActive: true, expiresAt: { $gt: now } }).lean<CouponDoc>();
  if (!c || (c.startsAt && c.startsAt > now) || (c.usageLimit > 0 && c.usedCount >= c.usageLimit)) return null;
  const headline = c.type === "percent" ? `${c.value}%` : formatMoney(c.value);
  const text = `on ${c.perCustomerLimit === 1 ? "your first order" : "orders"}${c.minOrder > 0 ? ` over ${formatMoney(c.minOrder)}` : ""}`;
  return { code, headline, text };
}
