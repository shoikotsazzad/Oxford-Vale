import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";

const CouponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, min: 0 }, // percent coupons only
    minOrder: { type: Number, default: 0 },
    startsAt: Date,
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    perCustomerLimit: { type: Number, default: 0 }, // 0 = unlimited, counted by phone
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type Coupon = InferSchemaType<typeof CouponSchema> & { _id: Types.ObjectId };
export const CouponModel = defineModel<Coupon>("Coupon", CouponSchema);
