import type { SizeType } from "@/models/enums";

const ALPHA = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

/**
 * Expand a CSV size range into individual sizes.
 * "38-46" / "36-46" / "28-40" → steps of 2 · "40-45" (shoes) → steps of 1 · "S-XXL" → S M L XL XXL ·
 * "M/L" → M, L · "One Size" → One Size.
 */
export function expandSizes(range: string, category: string): string[] {
  const r = range.trim();
  if (/^one size$/i.test(r)) return ["One Size"];
  if (r.includes("/")) return r.split("/").map((s) => s.trim());
  const num = r.match(/^(\d+)\s*-\s*(\d+)$/);
  if (num) {
    const [from, to] = [Number(num[1]), Number(num[2])];
    const step = category === "Shoes" ? 1 : 2;
    const out: string[] = [];
    for (let s = from; s <= to; s += step) out.push(String(s));
    return out;
  }
  const alpha = r.match(/^([A-Z0-9]+)\s*-\s*([A-Z0-9]+)$/i);
  if (alpha) {
    const a = ALPHA.indexOf(alpha[1].toUpperCase());
    const b = ALPHA.indexOf(alpha[2].toUpperCase());
    if (a >= 0 && b >= a) return ALPHA.slice(a, b + 1);
  }
  throw new Error(`Unknown size range "${range}"`);
}

export function sizeTypeFor(category: string, sizes: string[]): SizeType {
  if (sizes.length === 1 && sizes[0] === "One Size") return "one-size";
  if (category === "Shoes") return "shoe-eu";
  if (category === "Caps") return "hat";
  if (!/^\d+$/.test(sizes[0])) return "alpha";
  return category === "Trousers" ? "waist" : "chest";
}

export const sizeTypeLabel: Record<SizeType, string> = {
  chest: "Chest (inches)",
  waist: "Waist (inches)",
  "shoe-eu": "EU size",
  alpha: "Size",
  hat: "Size",
  "one-size": "Size",
};
