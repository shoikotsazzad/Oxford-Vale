// Pure delivery-option matching (no server-only import, so tests and the checkout client summary can use it).
import type { ZoneDTO } from "./delivery";

type Matchable = Pick<ZoneDTO, "id" | "countries">;

/**
 * Delivery options for a country, in admin order. Options that list the country win;
 * options with no countries ("Rest of world") apply only when nothing lists it.
 */
export function optionsFor<Z extends Matchable>(zones: Z[], country: string): Z[] {
  const listed = zones.filter((z) => z.countries.includes(country));
  return listed.length ? listed : zones.filter((z) => !z.countries.length);
}

/** The chosen option if it is valid for the country, else null. */
export function pickOption<Z extends Matchable>(zones: Z[], country: string, optionId: string | null | undefined): Z | null {
  return optionsFor(zones, country).find((z) => z.id === optionId) ?? null;
}
