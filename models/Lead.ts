import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";

const SnapshotItemSchema = new Schema(
  { name: String, sku: String, size: String, colour: String, qty: Number, unitPrice: Number },
  { _id: false },
);

const LeadSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    email: { type: String, default: "" },
    cart: { type: Schema.Types.ObjectId, ref: "Cart", index: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    source: { type: String, enum: ["add_to_cart", "checkout"], default: "add_to_cart" },
    status: { type: String, enum: ["cart", "abandoned", "converted"], default: "cart", index: true },
    cartSnapshot: { type: [SnapshotItemSchema], default: [] },
    cartValue: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now, index: true },
    abandonedAt: Date,
    adminNotifiedAt: Date,
    order: { type: Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true },
);

export type Lead = InferSchemaType<typeof LeadSchema> & { _id: Types.ObjectId };
export const LeadModel = defineModel<Lead>("Lead", LeadSchema);
