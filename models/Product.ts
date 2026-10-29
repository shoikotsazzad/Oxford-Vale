import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";
import { ImageSchema, SIZE_TYPES } from "./shared";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    skuBase: { type: String, required: true, unique: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    collections: [{ type: Schema.Types.ObjectId, ref: "Collection", index: true }],
    tags: { type: [String], default: [] },
    description: { type: String, default: "" },
    fabric: { type: String, default: "" },
    careNotes: { type: String, default: "" },
    images: { type: [ImageSchema], default: [] },
    price: { type: Number, required: true, min: 0 }, // cents (USD)
    salePrice: { type: Number, min: 0 },
    status: { type: String, enum: ["draft", "active", "archived"], default: "active", index: true },
    sizeType: { type: String, enum: SIZE_TYPES, required: true },
    // Denormalised from variants (kept in sync by services/product.ts) for fast filters and sort.
    colours: { type: [String], default: [] },
    sizes: { type: [String], default: [] },
    minPrice: { type: Number, default: 0, index: true },
    inStock: { type: Boolean, default: true },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
  },
  { timestamps: true },
);

ProductSchema.index({ name: "text", fabric: "text", tags: "text" }, { weights: { name: 5, tags: 2, fabric: 1 } });
ProductSchema.index({ status: 1, category: 1, minPrice: 1 });

export type Product = InferSchemaType<typeof ProductSchema> & { _id: Types.ObjectId };
export const ProductModel = defineModel<Product>("Product", ProductSchema);
