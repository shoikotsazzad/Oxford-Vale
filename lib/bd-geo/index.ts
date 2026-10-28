// Bangladesh divisions → districts → upazilas (source: github.com/nuhil/bangladesh-geocode, MIT).
// Dhaka district also lists the Dhaka Metropolitan thanas so "Dhaka City" can be matched by area.
import geo from "./bd-geo.json";
import dhakaCityAreas from "./dhaka-city-areas.json";

export type Upazila = { name: string; bn?: string };
export type District = { name: string; bn: string; upazilas: Upazila[] };
export type Division = { name: string; bn: string; districts: District[] };

export const divisions = geo as Division[];
export const DHAKA_CITY_AREAS = dhakaCityAreas as string[];

export const districtsOf = (division: string) => divisions.find((d) => d.name === division)?.districts ?? [];
export const upazilasOf = (division: string, district: string) =>
  districtsOf(division).find((d) => d.name === district)?.upazilas ?? [];

export function isValidLocation(division: string, district: string, upazila: string) {
  return upazilasOf(division, district).some((u) => u.name === upazila);
}
