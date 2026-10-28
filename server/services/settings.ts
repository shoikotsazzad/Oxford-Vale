import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connectDB } from "@/server/db";
import { SettingModel } from "@/models/Setting";
import { site } from "@/data/site";
import type { StoreSettings } from "@/lib/types";

export const SETTINGS_TAG = "settings";

/** Defaults from data/site.ts, used when the Setting document is missing a value. */
const defaults: StoreSettings = {
  storeName: site.name,
  tagline: site.tagline,
  legal: site.legal,
  contact: { phone: site.phoneDisplay, whatsapp: site.whatsappDisplay, email: site.email, supportEmail: site.supportEmail, ordersEmail: site.ordersEmail },
  address: site.address,
  hours: site.hoursText,
  socials: site.socials,
  announcementBar: { ...site.announcement, active: true },
  hero: site.hero,
  newSeasonBanner: site.newSeasonBanner,
  freeDeliveryThreshold: site.freeDeliveryThreshold,
  abandonedAfterMinutes: site.abandonedAfterMinutes,
  lowStockThreshold: site.lowStockThreshold,
  payments: { cod: true, sslcommerz: true, bkash: { enabled: true, number: site.payments.bkashNumber }, nagad: { enabled: true, number: site.payments.nagadNumber } },
  bank: site.bank,
  invoiceFooter: site.invoiceFooter,
};

// Deep-merge saved values over defaults, so a partially filled document still renders.
function merge<T>(base: T, saved: unknown): T {
  if (saved === undefined || saved === null) return base;
  if (Array.isArray(base)) return (Array.isArray(saved) && saved.length ? saved : base) as T;
  if (typeof base === "object" && base !== null) {
    const out = { ...base } as Record<string, unknown>;
    for (const key of Object.keys(base)) out[key] = merge((base as Record<string, unknown>)[key], (saved as Record<string, unknown>)[key]);
    return out as T;
  }
  return (saved === "" && base !== "" ? base : saved) as T;
}

export async function getSettings(): Promise<StoreSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("hours");
  await connectDB();
  const doc = await SettingModel.findOne({ key: "store" }).lean();
  const plain = doc ? JSON.parse(JSON.stringify(doc)) : null;
  return merge(defaults, plain);
}
