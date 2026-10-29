// The store is English only (UK spelling). Labels live in one dictionary so wording stays consistent.
import { en, type Dict } from "./en";

export type { Dict };
export const getDictionary = (): Dict => en;

/** Fill {placeholders}: fmt("Only {n} left", { n: 3 }). */
export const fmt = (text: string, vars: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
