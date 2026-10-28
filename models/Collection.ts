import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";

const CollectionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }], // ordered
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type Collection = InferSchemaType<typeof CollectionSchema> & { _id: Types.ObjectId };
export const CollectionModel = defineModel<Collection>("Collection", CollectionSchema);
