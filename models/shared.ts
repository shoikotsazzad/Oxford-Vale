import { Schema } from "mongoose";

/** Postal address (UK first; country is an ISO code), embedded in users and orders. */
export const postalFields = {
  name: { type: String, required: true },
  phone: { type: String, required: true },
  line1: { type: String, required: true },
  line2: { type: String, default: "" },
  city: { type: String, required: true },
  county: { type: String, default: "" },
  postcode: { type: String, default: "" },
  country: { type: String, required: true, default: "GB" },
};

export const AddressSchema = new Schema(
  { label: { type: String, default: "Home" }, ...postalFields, isDefault: { type: Boolean, default: false } },
  { _id: true },
);

export const ImageSchema = new Schema(
  { url: { type: String, required: true }, alt: { type: String, default: "" }, sortOrder: { type: Number, default: 0 } },
  { _id: false },
);

export * from "./enums";
