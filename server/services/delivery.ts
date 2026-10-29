import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connectDB } from "@/server/db";
import { DeliveryZoneModel } from "@/models/DeliveryZone";

export const ZONES_TAG = "delivery-zones";

export type ZoneDTO = { id: string; name: string; fee: number; etaMinDays: number; etaMaxDays: number; countries: string[]; freeEligible: boolean; note: string };

export async function getZones(): Promise<ZoneDTO[]> {
  "use cache";
  cacheTag(ZONES_TAG);
  cacheLife("hours");
  await connectDB();
  const zones = await DeliveryZoneModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
  return zones.map((z) => ({
    id: String(z._id), name: z.name, fee: z.fee, etaMinDays: z.etaMinDays, etaMaxDays: z.etaMaxDays,
    countries: z.countries ?? [], freeEligible: Boolean(z.freeEligible), note: z.note ?? "",
  }));
}

export { optionsFor, pickOption } from "./zone-match";
