import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";

/** Every email/SMS sent (or mocked), so the admin can see exactly what went out. */
const NotificationLogSchema = new Schema(
  {
    channel: { type: String, enum: ["email", "sms"], required: true },
    to: { type: String, required: true },
    subject: String,
    body: { type: String, required: true },
    provider: { type: String, required: true },
    status: { type: String, enum: ["sent", "logged", "failed"], required: true },
    error: String,
    ref: { type: { type: String }, id: String }, // e.g. { type: "order", id: "OV-…" }
    event: { type: String, index: true }, // e.g. "order.placed"; used to avoid sending the same message twice
  },
  { timestamps: true },
);

export type NotificationLog = InferSchemaType<typeof NotificationLogSchema> & { _id: Types.ObjectId };
export const NotificationLogModel = defineModel<NotificationLog>("NotificationLog", NotificationLogSchema);
