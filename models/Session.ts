import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";

const SessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expiresAt: { type: Date, required: true, expires: 0 },
    userAgent: String,
    ip: String,
  },
  { timestamps: true },
);

export type Session = InferSchemaType<typeof SessionSchema> & { _id: Types.ObjectId };
export const SessionModel = defineModel<Session>("Session", SessionSchema);
