import { Schema } from "mongoose";

/** Bangladesh address, embedded in users and orders. */
export const AddressSchema = new Schema(
  {
    label: { type: String, default: "Home" },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    division: { type: String, required: true },
    district: { type: String, required: true },
    upazila: { type: String, required: true },
    addressLine: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

export const ImageSchema = new Schema(
  { url: { type: String, required: true }, alt: { type: String, default: "" }, sortOrder: { type: Number, default: 0 } },
  { _id: false },
);

export * from "./enums";
