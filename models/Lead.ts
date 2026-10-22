import { Schema, model, models, type InferSchemaType } from "mongoose";

const LeadSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    message: { type: String, required: true },
    page: String,
    status: { type: String, enum: ["new", "contacted", "closed"], default: "new" },
  },
  { timestamps: true },
);

export type Lead = InferSchemaType<typeof LeadSchema>;
export const LeadModel = models.Lead || model("Lead", LeadSchema);
