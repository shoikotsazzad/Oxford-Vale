// Pure zone matching (no server-only import, so tests and the checkout client summary can use it).
import type { ZoneDTO } from "./delivery";

export type AddressArea = { division: string; district: string; upazila: string };

/**
 * Pick the delivery zone for an address. Most specific rule wins:
 * area (upazila / Dhaka thana) → district → division → a zone with no rules (fallback).
 */
export function resolveZone<Z extends Pick<ZoneDTO, "match">>(zones: Z[], a: AddressArea): Z | null {
  return (
    zones.find((z) => z.match.areas.includes(a.upazila)) ??
    zones.find((z) => z.match.districts.includes(a.district)) ??
    zones.find((z) => z.match.divisions.includes(a.division)) ??
    zones.find((z) => !z.match.areas.length && !z.match.districts.length && !z.match.divisions.length) ??
    null
  );
}
