import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";

const CtaSchema = new Schema({ label: String, href: String }, { _id: false });

/** Single document (key "store") holding everything the admin can edit about the store. */
const SettingSchema = new Schema(
  {
    key: { type: String, default: "store", unique: true },
    storeName: { type: String, required: true },
    tagline: { type: String, default: "" },
    legal: { name: String, tradeLicence: String, tin: String, bin: String },
    contact: { phone: String, whatsapp: String, email: String, supportEmail: String, ordersEmail: String },
    address: { line: String, area: String, city: String, postalCode: String, country: { type: String, default: "Bangladesh" } },
    hours: [{ _id: false, label: String, value: String }],
    socials: { facebook: String, instagram: String, youtube: String, tiktok: String },
    announcementBar: { text: String, link: String, active: { type: Boolean, default: true } },
    hero: { eyebrow: String, title: String, subtitle: String, image: String, note: String, ctas: { type: [CtaSchema], default: [] } },
    newSeasonBanner: { eyebrow: String, title: String, text: String, image: String, cta: CtaSchema },
    freeDeliveryThreshold: { type: Number, default: 0 },
    abandonedAfterMinutes: { type: Number, default: 60 },
    lowStockThreshold: { type: Number, default: 5 },
    payments: {
      cod: { type: Boolean, default: true },
      sslcommerz: { type: Boolean, default: true },
      bkash: { enabled: { type: Boolean, default: true }, number: String },
      nagad: { enabled: { type: Boolean, default: true }, number: String },
    },
    bank: { accountName: String, accountNo: String, bankBranch: String },
    invoiceFooter: { type: String, default: "" },
  },
  { timestamps: true },
);

export type Setting = InferSchemaType<typeof SettingSchema> & { _id: Types.ObjectId };
export const SettingModel = defineModel<Setting>("Setting", SettingSchema);
