import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";

const DeliveryZoneSchema = new Schema(
  {
    name: { type: String, required: true },
    fee: { type: Number, required: true, min: 0 },
    etaMinDays: { type: Number, required: true, min: 0 },
    etaMaxDays: { type: Number, required: true, min: 0 },
    // Most specific match wins: area (upazila) > district > division. A zone with no rules is the fallback.
    match: {
      divisions: { type: [String], default: [] },
      districts: { type: [String], default: [] },
      areas: { type: [String], default: [] },
    },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type DeliveryZone = InferSchemaType<typeof DeliveryZoneSchema> & { _id: Types.ObjectId };
export const DeliveryZoneModel = defineModel<DeliveryZone>("DeliveryZone", DeliveryZoneSchema);
