import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_model";

const CtaSchema = new Schema({ label: String, href: String }, { _id: false });

/** Single document (key "store") holding everything the admin can edit about the store. */
const SettingSchema = new Schema(
  {
    key: { type: String, default: "store", unique: true },
    storeName: { type: String, required: true },
    tagline: { type: String, default: "" },
    legal: { name: String, companyNo: String, vatNo: String, registeredOffice: String },
    contact: { phone: String, freephone: String, email: String, supportEmail: String, ordersEmail: String },
    address: { line: String, area: String, city: String, postalCode: String, country: { type: String, default: "United Kingdom" } },
    hours: [{ _id: false, label: String, value: String }],
    socials: { facebook: String, instagram: String, x: String, youtube: String },
    announcementBar: { text: String, link: String, active: { type: Boolean, default: true } },
    hero: { eyebrow: String, title: String, subtitle: String, image: String, note: String, ctas: { type: [CtaSchema], default: [] } },
    newSeasonBanner: { eyebrow: String, title: String, text: String, image: String, cta: CtaSchema },
    freeDeliveryThreshold: { type: Number, default: 0 }, // cents
    abandonedAfterMinutes: { type: Number, default: 60 },
    lowStockThreshold: { type: Number, default: 5 },
    payments: { stripe: { type: Boolean, default: true }, paypal: { type: Boolean, default: true } },
    bank: { accountName: String, sortCode: String, accountNo: String, bank: String },
    invoiceFooter: { type: String, default: "" },
  },
  { timestamps: true },
);

export type Setting = InferSchemaType<typeof SettingSchema> & { _id: Types.ObjectId };
export const SettingModel = defineModel<Setting>("Setting", SettingSchema);
