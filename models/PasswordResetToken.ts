import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";

const PasswordResetTokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, expires: 0 },
    usedAt: Date,
  },
  { timestamps: true },
);

export type PasswordResetToken = InferSchemaType<typeof PasswordResetTokenSchema> & { _id: Types.ObjectId };
export const PasswordResetTokenModel = defineModel<PasswordResetToken>("PasswordResetToken", PasswordResetTokenSchema);
