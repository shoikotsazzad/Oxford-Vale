import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";

/**
 * A delivery option (UK Standard, UK Next day, Europe…). Offered to the listed countries (ISO codes);
 * an option with no countries covers the rest of the world. The shopper picks one at checkout.
 */
const DeliveryZoneSchema = new Schema(
  {
    name: { type: String, required: true },
    fee: { type: Number, required: true, min: 0 }, // cents
    etaMinDays: { type: Number, required: true, min: 0 },
    etaMaxDays: { type: Number, required: true, min: 0 },
    countries: { type: [String], default: [] },
    /** Free when the order reaches the store's free-delivery threshold. */
    freeEligible: { type: Boolean, default: false },
    note: { type: String, default: "" }, // e.g. "Order before 2pm"
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type DeliveryZone = InferSchemaType<typeof DeliveryZoneSchema> & { _id: Types.ObjectId };
export const DeliveryZoneModel = defineModel<DeliveryZone>("DeliveryZone", DeliveryZoneSchema);
