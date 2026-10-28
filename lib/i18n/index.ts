import { en, type Dict } from "./en";
import { bn } from "./bn";

export type Lang = "en" | "bn";
export type { Dict };
export const LANG_COOKIE = "lang";
export const isLang = (v: unknown): v is Lang => v === "en" || v === "bn";
export const getDictionary = (lang: Lang): Dict => (lang === "bn" ? bn : en);

/** Fill {placeholders}: fmt("Only {n} left", { n: 3 }). */
export const fmt = (text: string, vars: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
