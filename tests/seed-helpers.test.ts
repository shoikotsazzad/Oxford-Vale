import path from "node:path";
import { describe, expect, it } from "vitest";
import { expandSizes, sizeTypeFor } from "@/lib/size-ranges";
import { formatBDT } from "@/lib/money";
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

describe("formatBDT", () => {
  it("uses the taka sign and South Asian grouping", () => {
    expect(formatBDT(18500)).toBe("৳18,500");
    expect(formatBDT(125000)).toBe("৳1,25,000");
    expect(formatBDT(0)).toBe("৳0");
  });
});

describe("phoneSchema", () => {
  it("accepts and normalises BD mobile numbers", () => {
    expect(phoneSchema.parse("01712-345678")).toBe("01712345678");
    expect(phoneSchema.parse("+8801912345678")).toBe("01912345678");
  });
  it("rejects invalid numbers", () => {
    expect(phoneSchema.safeParse("01212345678").success).toBe(false);
    expect(phoneSchema.safeParse("0171234567").success).toBe(false);
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
