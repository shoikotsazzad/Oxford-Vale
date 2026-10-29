import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, postalFields } from "./shared";

/** OrderItem: an embedded price snapshot, always read with its order. */
const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: Schema.Types.ObjectId, ref: "Variant", required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    size: String,
    colour: String,
    image: String,
    regularPrice: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    orderNo: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    cart: { type: Schema.Types.ObjectId, ref: "Cart" },
    lead: { type: Schema.Types.ObjectId, ref: "Lead" },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true, index: true },
      email: { type: String, default: "" },
    },
    shippingAddress: postalFields,
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    couponCode: String,
    discount: { type: Number, default: 0 },
    delivery: {
      zone: { type: Schema.Types.ObjectId, ref: "DeliveryZone" },
      name: String,
      fee: { type: Number, default: 0 },
      etaMinDays: Number,
      etaMaxDays: Number,
    },
    total: { type: Number, required: true },
    note: { type: String, default: "" },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "unpaid", index: true },
    // Provider references: Stripe Checkout session + payment intent, or PayPal order + capture.
    payment: {
      sessionId: String,
      gatewayTranId: String,
      brand: String,
      verifiedAt: Date,
    },
    status: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },
    statusHistory: [
      {
        _id: false,
        status: { type: String, enum: ORDER_STATUSES },
        at: { type: Date, default: Date.now },
        by: { type: Schema.Types.ObjectId, ref: "User" },
        note: String,
      },
    ],
    internalNotes: [
      { _id: false, text: String, by: { type: Schema.Types.ObjectId, ref: "User" }, byName: String, at: { type: Date, default: Date.now } },
    ],
    shipment: { courier: String, trackingNo: String },
    stockRestoredAt: Date,
    cancelledBy: { type: String, enum: ["customer", "admin", "system"] },
  },
  { timestamps: true },
);

OrderSchema.index({ createdAt: -1 });

export type Order = InferSchemaType<typeof OrderSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
export const OrderModel = defineModel<Order>("Order", OrderSchema);
