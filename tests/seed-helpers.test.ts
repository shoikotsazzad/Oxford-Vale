import path from "node:path";
import { describe, expect, it } from "vitest";
import { expandSizes, sizeTypeFor } from "@/lib/size-ranges";
import { formatMoney, formatMoneyExact, toCents, toDollars } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { formatPostcode, isUkPostcode } from "@/lib/address";
import { londonDateKey, londonDayStart, londonLocalToDate } from "@/lib/dates";
import { usdPrices, USD_RANGES } from "@/scripts/seed/usd";
import { phoneSchema } from "@/lib/validation/common";
import { readProductsCsv } from "@/scripts/seed/csv";
import { fabricFamily } from "@/scripts/seed/copy";

describe("expandSizes", () => {
  it("expands chest and waist ranges in steps of 2", () => {
    expect(expandSizes("38-46", "Suits")).toEqual(["38", "40", "42", "44", "46"]);
    expect(expandSizes("28-40", "Trousers")).toHaveLength(7);
  });
  it("expands shoe sizes in steps of 1", () => {
    expect(expandSizes("40-45", "Shoes")).toEqual(["40", "41", "42", "43", "44", "45"]);
  });
  it("expands alpha, slash and one-size ranges", () => {
    expect(expandSizes("S-XXL", "Shirts")).toEqual(["S", "M", "L", "XL", "XXL"]);
    expect(expandSizes("M/L", "Caps")).toEqual(["M", "L"]);
    expect(expandSizes("One Size", "Ties")).toEqual(["One Size"]);
  });
  it("rejects unknown ranges", () => {
    expect(() => expandSizes("tiny-huge", "Shirts")).toThrow();
  });
  it("picks the size type", () => {
    expect(sizeTypeFor("Trousers", ["28", "30"])).toBe("waist");
    expect(sizeTypeFor("Trousers", ["S", "M"])).toBe("alpha");
    expect(sizeTypeFor("Shoes", ["40"])).toBe("shoe-eu");
    expect(sizeTypeFor("Ties", ["One Size"])).toBe("one-size");
  });
});

describe("money (USD cents)", () => {
  it("formats cents as dollars, dropping .00 except where exact amounts are needed", () => {
    expect(formatMoney(23500)).toBe("$235");
    expect(formatMoney(895)).toBe("$8.95");
    expect(formatMoney(123456700)).toBe("$1,234,567");
    expect(formatMoneyExact(23500)).toBe("$235.00");
  });
  it("converts between form dollars and stored cents", () => {
    expect(toCents("8.95")).toBe(895);
    expect(toCents(235)).toBe(23500);
    expect(toDollars(895)).toBe("8.95");
    expect(toDollars(23500)).toBe("235");
  });
});

describe("phoneSchema", () => {
  it("accepts UK mobiles and landlines and normalises them", () => {
    expect(phoneSchema.parse("07700 900123")).toBe("07700900123");
    expect(phoneSchema.parse("+44 (0)20 7946 0001")).toBe("02079460001");
    expect(phoneSchema.parse("0800 000 0001")).toBe("08000000001");
  });
  it("accepts international numbers with a country code", () => {
    expect(phoneSchema.parse("+1 212 555 0100")).toBe("+12125550100");
  });
  it("rejects invalid numbers", () => {
    expect(phoneSchema.safeParse("12345").success).toBe(false);
    expect(phoneSchema.safeParse("0770090012").success).toBe(false);
  });
  it("displays numbers in UK groupings", () => {
    expect(formatPhone("02079460001")).toBe("020 7946 0001");
    expect(formatPhone("07700900123")).toBe("07700 900123");
    expect(formatPhone("08000000001")).toBe("0800 000 0001");
  });
});

describe("UK postcodes", () => {
  it("validates and formats", () => {
    expect(isUkPostcode("sw1a1aa")).toBe(true);
    expect(formatPostcode("w1s3pr")).toBe("W1S 3PR");
    expect(isUkPostcode("12345")).toBe(false);
    expect(formatPostcode("75007", "FR")).toBe("75007");
  });
});

describe("UK time", () => {
  it("starts the day at midnight London time in winter and summer", () => {
    expect(londonDayStart(new Date("2026-12-15T23:30:00Z")).toISOString()).toBe("2026-12-15T00:00:00.000Z");
    expect(londonDayStart(new Date("2026-07-15T23:30:00Z")).toISOString()).toBe("2026-07-15T23:00:00.000Z");
    expect(londonDateKey(new Date("2026-07-15T23:30:00Z"))).toBe("2026-07-16");
  });
  it("reads datetime-local values as London time", () => {
    expect(londonLocalToDate("2026-07-01T09:00").toISOString()).toBe("2026-07-01T08:00:00.000Z");
    expect(londonLocalToDate("2026-12-01T09:00").toISOString()).toBe("2026-12-01T09:00:00.000Z");
  });
});

describe("dollar price ladder", () => {
  const rows = readProductsCsv(path.join(process.cwd(), "data/seed/products.csv"));
  const prices = usdPrices(rows);
  it("keeps every product inside its category range, on $5 steps", () => {
    for (const r of rows) {
      const p = prices.get(r.sku)!;
      const [lo, hi] = USD_RANGES[r.category];
      expect(p.price).toBeGreaterThanOrEqual(lo * 100);
      expect(p.price).toBeLessThanOrEqual(hi * 100);
      expect(p.price % 500).toBe(0);
    }
  });
  it("keeps sale prices below the price and the order of prices within a category", () => {
    for (const r of rows) {
      const p = prices.get(r.sku)!;
      if (p.salePrice !== undefined) expect(p.salePrice).toBeLessThan(p.price);
    }
    const suits = rows.filter((r) => r.category === "Suits").sort((a, b) => a.price - b.price);
    const usd = suits.map((r) => prices.get(r.sku)!.price);
    expect([...usd].sort((a, b) => a - b)).toEqual(usd);
  });
});

describe("products.csv", () => {
  const rows = readProductsCsv(path.join(process.cwd(), "data/seed/products.csv"));
  it("has 150 valid products with unique SKUs", () => {
    expect(rows).toHaveLength(150);
    expect(new Set(rows.map((r) => r.sku)).size).toBe(150);
  });
  it("expands to 677 variants", () => {
    expect(rows.reduce((n, r) => n + expandSizes(r.sizes, r.category).length, 0)).toBe(677);
  });
  it("maps every fabric to a family", () => {
    expect(fabricFamily("Harris tweed")).toBe("tweed");
    expect(fabricFamily("Full grain leather")).toBe("leather");
    expect(fabricFamily("Nylon with down")).toBe("synthetic");
  });
});
