import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";
import { AddressSchema, ROLES } from "./shared";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "customer", index: true },
    addresses: { type: [AddressSchema], default: [] },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof UserSchema> & { _id: Types.ObjectId };
export const UserModel = defineModel<User>("User", UserSchema);
