import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";

const AuditLogSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: "User" },
  actorName: String,
  actorRole: String,
  action: { type: String, required: true, index: true }, // e.g. "order.status.update", "product.archive"
  entity: { type: { type: String }, id: String, label: String },
  changes: { type: Schema.Types.Mixed }, // { field: { from, to } }
  ip: String,
  at: { type: Date, default: Date.now, index: true },
});

export type AuditLog = InferSchemaType<typeof AuditLogSchema> & { _id: Types.ObjectId };
export const AuditLogModel = defineModel<AuditLog>("AuditLog", AuditLogSchema);
