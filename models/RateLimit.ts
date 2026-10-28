import { Schema, type InferSchemaType } from "mongoose";
import { defineModel } from "./_model";

const RateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export type RateLimit = InferSchemaType<typeof RateLimitSchema>;
export const RateLimitModel = defineModel<RateLimit>("RateLimit", RateLimitSchema);
