import { describe, expect, it } from "vitest";
import { resolveZone } from "@/server/services/zone-match";

const zones = [
  { id: "city", match: { divisions: [], districts: [], areas: ["Gulshan", "Mirpur"] } },
  { id: "dhaka-out", match: { divisions: [], districts: ["Dhaka", "Gazipur"], areas: [] } },
  { id: "ctg", match: { divisions: [], districts: ["Chattogram"], areas: [] } },
  { id: "rest", match: { divisions: [], districts: [], areas: [] } },
];

describe("resolveZone", () => {
  it("matches Dhaka city areas before the Dhaka district", () => {
    expect(resolveZone(zones, { division: "Dhaka", district: "Dhaka", upazila: "Gulshan" })?.id).toBe("city");
  });
  it("matches by district", () => {
    expect(resolveZone(zones, { division: "Dhaka", district: "Dhaka", upazila: "Savar" })?.id).toBe("dhaka-out");
    expect(resolveZone(zones, { division: "Chattogram", district: "Chattogram", upazila: "Patiya" })?.id).toBe("ctg");
  });
  it("falls back to the zone without rules", () => {
    expect(resolveZone(zones, { division: "Sylhet", district: "Sylhet", upazila: "Companiganj" })?.id).toBe("rest");
  });
  it("returns null when there is no fallback", () => {
    expect(resolveZone(zones.slice(0, 3), { division: "Sylhet", district: "Sylhet", upazila: "X" })).toBeNull();
  });
});
