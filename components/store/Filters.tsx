"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useI18n } from "@/components/I18nProvider";
import { CheckIcon, CloseIcon, FilterIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/Button";
import { withParams } from "@/lib/filters";
import { formatBDT } from "@/lib/money";
import { isLight } from "@/lib/colours";
import type { ProductListResult, SortKey } from "@/lib/types";
import { SORT_KEYS } from "@/lib/types";

type Facets = ProductListResult["facets"];
type Active = { sizes: string[]; colours: string[]; min?: number; max?: number; sort: SortKey };

function useListingNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const update = (changes: Record<string, string | string[] | null>) =>
    start(() => router.push(`${pathname}${withParams(new URLSearchParams(params.toString()), changes)}`, { scroll: false }));
  return { update, pending, clear: () => start(() => router.push(pathname, { scroll: false })) };
}

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function FilterGroups({ facets, active, update }: { facets: Facets; active: Active; update: (c: Record<string, string | string[] | null>) => void }) {
  const { t } = useI18n();
  const [min, setMin] = useState(active.min?.toString() ?? "");
  const [max, setMax] = useState(active.max?.toString() ?? "");
  return (
    <div className="space-y-8">
      {facets.sizes.length > 1 && (
        <fieldset>
          <legend className="label">{t.listing.size}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {facets.sizes.map((s) => {
              const on = active.sizes.includes(s);
              return (
                <button key={s} type="button" aria-pressed={on} onClick={() => update({ size: toggle(active.sizes, s) })}
                  className={`min-h-10 min-w-11 rounded-md border px-3 text-sm transition-colors ${on ? "border-ink bg-ink text-white" : "border-line bg-white/60 hover:border-ink"}`}>
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {facets.colours.length > 1 && (
        <fieldset>
          <legend className="label">{t.listing.colour}</legend>
          <ul className="mt-3 space-y-1">
            {facets.colours.map((c) => {
              const on = active.colours.includes(c.name);
              return (
                <li key={c.name}>
                  <button type="button" aria-pressed={on} onClick={() => update({ colour: toggle(active.colours, c.name) })} className="flex min-h-10 w-full items-center gap-3 text-left text-sm">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${on ? "border-ink ring-2 ring-ink ring-offset-2 ring-offset-paper" : "border-ink/20"}`} style={{ background: c.hex }}>
                      {on && <CheckIcon size={12} className={isLight(c.hex) ? "text-ink" : "text-white"} />}
                    </span>
                    {c.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      <fieldset>
        <legend className="label">{t.listing.price}</legend>
        <p className="mt-1 text-xs text-muted">{formatBDT(facets.minPrice)} – {formatBDT(facets.maxPrice)}</p>
        <form
          className="mt-3 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update({ min: min || null, max: max || null });
          }}
        >
          <label className="flex-1 text-xs text-muted">
            {t.listing.min}
            <input inputMode="numeric" pattern="[0-9]*" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder="৳" className="mt-1 block min-h-10 w-full rounded-md border border-line bg-white px-2 text-sm text-ink" />
          </label>
          <label className="flex-1 text-xs text-muted">
            {t.listing.max}
            <input inputMode="numeric" pattern="[0-9]*" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder="৳" className="mt-1 block min-h-10 w-full rounded-md border border-line bg-white px-2 text-sm text-ink" />
          </label>
          <button type="submit" className="label min-h-10 rounded-md border border-ink px-3">OK</button>
        </form>
      </fieldset>
    </div>
  );
}

export function Filters({ facets, active }: { facets: Facets; active: Active }) {
  const { t } = useI18n();
  const { update, pending, clear } = useListingNav();
  const [open, setOpen] = useState(false);
  const count = active.sizes.length + active.colours.length + (active.min !== undefined || active.max !== undefined ? 1 : 0);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:block ${pending ? "opacity-60" : ""}`} aria-label={t.listing.filters}>
        <div className="flex items-center justify-between">
          <p className="font-serif text-xl">{t.listing.filters}</p>
          {count > 0 && <button type="button" onClick={clear} className="text-xs underline underline-offset-4">{t.listing.clear}</button>}
        </div>
        <div className="mt-6"><FilterGroups key={`${active.min}-${active.max}`} facets={facets} active={active} update={update} /></div>
      </aside>

      {/* Mobile trigger + drawer */}
      <button type="button" onClick={() => setOpen(true)} className="label flex min-h-11 items-center gap-2 rounded-md border border-line px-4 lg:hidden">
        <FilterIcon size={16} /> {t.listing.filter}{count > 0 && ` (${count})`}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t.listing.filters}>
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-paper">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <p className="font-serif text-xl">{t.listing.filters}</p>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.nav.close} className="flex h-11 w-11 items-center justify-center"><CloseIcon /></button>
            </div>
            <div className={`flex-1 overflow-y-auto p-4 ${pending ? "opacity-60" : ""}`}>
              <FilterGroups key={`${active.min}-${active.max}`} facets={facets} active={active} update={update} />
            </div>
            <div className="flex gap-3 border-t border-line p-4">
              <Button variant="secondary" className="flex-1" onClick={clear} disabled={count === 0}>{t.listing.clear}</Button>
              <Button className="flex-1" onClick={() => setOpen(false)}>{t.listing.apply}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function SortSelect({ value }: { value: SortKey }) {
  const { t } = useI18n();
  const { update, pending } = useListingNav();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted sm:inline">{t.listing.sort}</span>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })}
        className="min-h-11 rounded-md border border-line bg-white/60 px-3 text-sm"
        aria-label={t.listing.sort}
      >
        {SORT_KEYS.map((k) => <option key={k} value={k}>{t.listing.sorts[k]}</option>)}
      </select>
    </label>
  );
}

export function ActiveFilterChips({ active }: { active: Active }) {
  const { t } = useI18n();
  const { update } = useListingNav();
  const chips = [
    ...active.sizes.map((s) => ({ label: `${t.listing.size}: ${s}`, onRemove: () => update({ size: active.sizes.filter((x) => x !== s) }) })),
    ...active.colours.map((c) => ({ label: c, onRemove: () => update({ colour: active.colours.filter((x) => x !== c) }) })),
    ...(active.min !== undefined || active.max !== undefined
      ? [{ label: `${active.min !== undefined ? formatBDT(active.min) : "৳0"} – ${active.max !== undefined ? formatBDT(active.max) : "∞"}`, onRemove: () => update({ min: null, max: null }) }]
      : []),
  ];
  if (!chips.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <li key={c.label}>
          <button type="button" onClick={c.onRemove} className="flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-white/60 px-3 text-xs hover:border-ink">
            {c.label} <CloseIcon size={12} />
          </button>
        </li>
      ))}
    </ul>
  );
}
