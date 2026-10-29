import { describe, expect, it } from "vitest";
import { optionsFor, pickOption } from "@/server/services/zone-match";

const zones = [
  { id: "uk-standard", countries: ["GB"] },
  { id: "uk-next", countries: ["GB"] },
  { id: "europe", countries: ["FR", "DE", "IE"] },
  { id: "world", countries: [] },
];

describe("delivery options", () => {
  it("offers every option that lists the country, in admin order", () => {
    expect(optionsFor(zones, "GB").map((z) => z.id)).toEqual(["uk-standard", "uk-next"]);
    expect(optionsFor(zones, "FR").map((z) => z.id)).toEqual(["europe"]);
  });
  it("falls back to the options without countries", () => {
    expect(optionsFor(zones, "US").map((z) => z.id)).toEqual(["world"]);
  });
  it("offers nothing when no option covers the country", () => {
    expect(optionsFor(zones.slice(0, 3), "US")).toEqual([]);
  });
  it("only accepts a chosen option that is valid for the country", () => {
    expect(pickOption(zones, "GB", "uk-next")?.id).toBe("uk-next");
    expect(pickOption(zones, "FR", "uk-next")).toBeNull();
    expect(pickOption(zones, "US", "world")?.id).toBe("world");
  });
});
