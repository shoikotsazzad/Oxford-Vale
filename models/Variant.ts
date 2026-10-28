import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";

const VariantSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    sku: { type: String, required: true, unique: true },
    size: { type: String, required: true },
    colour: { type: String, required: true },
    colourHex: String,
    stock: { type: Number, required: true, min: 0, default: 0 },
    priceOverride: { type: Number, min: 0 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

VariantSchema.index({ stock: 1, isActive: 1 });

export type Variant = InferSchemaType<typeof VariantSchema> & { _id: Types.ObjectId };
export const VariantModel = defineModel<Variant>("Variant", VariantSchema);
