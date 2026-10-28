import { SORT_KEYS, type ProductQuery, type SortKey } from "./types";

export type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? v.split(",") : []).map((s) => s.trim()).filter(Boolean).slice(0, 20);
const int = (v: string | string[] | undefined) => {
  const n = Number(first(v));
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
};

/** URL search params → listing query (filters are sanitised; unknown values are ignored). */
export function parseListingParams(sp: SearchParams): Pick<ProductQuery, "sizes" | "colours" | "min" | "max" | "sort" | "page"> {
  const sort = first(sp.sort);
  return {
    sizes: list(sp.size),
    colours: list(sp.colour),
    min: int(sp.min),
    max: int(sp.max),
    sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : "featured",
    page: int(sp.page) || 1,
  };
}

/** Build a query string from the current params with changes applied. Changing a filter resets the page. */
export function withParams(current: URLSearchParams, changes: Record<string, string | string[] | null>) {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(changes)) {
    const v = Array.isArray(value) ? value.join(",") : value;
    if (v) next.set(key, v);
    else next.delete(key);
  }
  if (!("page" in changes)) next.delete("page");
  const s = next.toString();
  return s ? `?${s}` : "";
}
