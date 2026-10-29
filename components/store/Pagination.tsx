import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { withParams, type SearchParams } from "@/lib/filters";

function toURLSearchParams(sp: SearchParams) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v !== undefined) p.set(k, Array.isArray(v) ? v.join(",") : v);
  return p;
}

/** Numbered pages with ellipses: 1 … 4 5 6 … 12 */
function pageList(page: number, pages: number): (number | "…")[] {
  const set = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...set].sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? ["…" as const, n] : [n]));
}

export function Pagination({ page, pages, pathname, searchParams, t }: { page: number; pages: number; pathname: string; searchParams: SearchParams; t: Dict }) {
  if (pages <= 1) return null;
  const base = toURLSearchParams(searchParams);
  const href = (n: number) => `${pathname}${withParams(base, { page: n > 1 ? String(n) : null })}`;
  const cell = "flex h-11 min-w-11 items-center justify-center rounded-md px-3 text-sm";
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1">
      {page > 1 ? <Link href={href(page - 1)} className={`${cell} hover:bg-sand`} aria-label={t.listing.previous}><ChevronLeftIcon size={18} /></Link> : <span className={`${cell} opacity-30`}><ChevronLeftIcon size={18} /></span>}
      {pageList(page, pages).map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className={`${cell} text-muted`}>…</span>
        ) : (
          <Link key={n} href={href(n)} aria-current={n === page ? "page" : undefined} className={`${cell} ${n === page ? "bg-ink text-paper" : "hover:bg-sand"}`}>{n}</Link>
        ),
      )}
      {page < pages ? <Link href={href(page + 1)} className={`${cell} hover:bg-sand`} aria-label={t.listing.next}><ChevronRightIcon size={18} /></Link> : <span className={`${cell} opacity-30`}><ChevronRightIcon size={18} /></span>}
    </nav>
  );
}
