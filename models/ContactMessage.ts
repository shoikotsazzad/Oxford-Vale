import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";

const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    subject: { type: String, default: "" },
    message: { type: String, required: true },
    status: { type: String, enum: ["new", "read", "replied", "closed"], default: "new", index: true },
    ip: String,
  },
  { timestamps: true },
);

export type ContactMessage = InferSchemaType<typeof ContactMessageSchema> & { _id: Types.ObjectId };
export const ContactMessageModel = defineModel<ContactMessage>("ContactMessage", ContactMessageSchema);
