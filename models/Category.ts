import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    showInNav: { type: Boolean, default: false },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
  },
  { timestamps: true },
);

export type Category = InferSchemaType<typeof CategorySchema> & { _id: Types.ObjectId };
export const CategoryModel = defineModel<Category>("Category", CategorySchema);
