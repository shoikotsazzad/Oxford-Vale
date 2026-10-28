import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";

const CartItemSchema = new Schema(
  {
    variant: { type: Schema.Types.ObjectId, ref: "Variant", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    qty: { type: Number, required: true, min: 1 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// No prices stored: totals are always computed from the database.
const CartSchema = new Schema(
  {
    cartToken: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    items: { type: [CartItemSchema], default: [] },
    couponCode: String,
    lead: { type: Schema.Types.ObjectId, ref: "Lead" },
    leadSkipped: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "converted"], default: "active" },
    lastActivityAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 864e5), expires: 0 },
  },
  { timestamps: true },
);

export type Cart = InferSchemaType<typeof CartSchema> & { _id: Types.ObjectId };
export const CartModel = defineModel<Cart>("Cart", CartSchema);
