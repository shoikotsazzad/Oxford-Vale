"use client";
// Category, collection, coupon and delivery-option editors. Each saves via its admin action and returns to the list.
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Checkbox, SelectField, TextArea, TextField } from "@/components/ui/Field";
import { ChevronDownIcon, CloseIcon } from "@/components/ui/icons";
import { saveCategory, saveCollection } from "@/server/actions/admin/catalog";
import { deleteZone, saveCoupon, saveZone } from "@/server/actions/admin/store";
import { COUNTRIES, countryName, EUROPE, HOME_COUNTRY } from "@/lib/address";
import type { Result } from "@/server/result";
import { FormStatus, useAdminAction } from "./useAdminAction";

type Values = Record<string, unknown>;

/** Shared state + submit wiring for the small forms below. */
function useForm<T extends Values>(initial: T, save: (v: T) => Promise<Result<{ id: string }>>, back: string) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const action = useAdminAction();
  const set = <K extends keyof T>(k: K, value: T[K]) => {
    setV((p) => ({ ...p, [k]: value }));
    action.clear(k as string);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    action.run(() => save(v), { onOk: () => router.push(back) });
  };
  return { v, set, submit, ...action };
}

function Actions({ pending, back, label = "Save" }: { pending: boolean; back: string; label?: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : label}</Button>
      <Button variant="secondary" className="border-transparent" onClick={() => router.push(back)}>Cancel</Button>
    </div>
  );
}

export type CategoryValue = { id?: string; name: string; slug: string; description: string; image: string; sortOrder: number | string; isActive: boolean; showInNav: boolean; seoTitle: string; seoDescription: string };

export function CategoryForm({ initial }: { initial: CategoryValue }) {
  const back = "/admin/categories";
  const { v, set, submit, pending, error, fields } = useForm(initial, saveCategory, back);
  const t = (k: "name" | "slug" | "description" | "image" | "seoTitle" | "seoDescription" | "sortOrder") => ({ name: k, value: v[k], error: fields[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value) });
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" {...t("name")} />
        <TextField label="URL slug" {...t("slug")} hint="Changing it changes the shop link" />
      </div>
      <TextArea label="Description" rows={3} {...t("description")} />
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <TextField label="Image path or URL" {...t("image")} placeholder="/brand/category-suits.jpg" />
        <TextField label="Sort order" type="number" {...t("sortOrder")} />
      </div>
      <div className="flex flex-wrap gap-x-6">
        <Checkbox label="Visible in the store" name="isActive" checked={v.isActive} onChange={(x) => set("isActive", x)} />
        <Checkbox label="Show in the header menu" name="showInNav" checked={v.showInNav} onChange={(x) => set("showInNav", x)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="SEO title" {...t("seoTitle")} />
        <TextField label="SEO description" {...t("seoDescription")} />
      </div>
      <FormStatus error={error} message={null} />
      <Actions pending={pending} back={back} />
    </form>
  );
}

export type CollectionValue = { id?: string; name: string; slug: string; description: string; image: string; sortOrder: number | string; isActive: boolean; products: string[] };
type ProductOption = { id: string; name: string; sku: string };

export function CollectionForm({ initial, products }: { initial: CollectionValue; products: ProductOption[] }) {
  const back = "/admin/collections";
  const { v, set, submit, pending, error, fields } = useForm(initial, saveCollection, back);
  const [q, setQ] = useState("");
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const matches = q.trim().length >= 2 ? products.filter((p) => !v.products.includes(p.id) && `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase())).slice(0, 8) : [];
  const move = (i: number, d: -1 | 1) => {
    const list = [...v.products];
    [list[i], list[i + d]] = [list[i + d], list[i]];
    set("products", list);
  };
  const t = (k: "name" | "slug" | "description" | "image" | "sortOrder") => ({ name: k, value: v[k], error: fields[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value) });
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" {...t("name")} />
        <TextField label="URL slug" {...t("slug")} />
      </div>
      <TextArea label="Description" rows={2} {...t("description")} />
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <TextField label="Image path or URL" {...t("image")} />
        <TextField label="Sort order" type="number" {...t("sortOrder")} />
      </div>
      <Checkbox label="Visible in the store" name="isActive" checked={v.isActive} onChange={(x) => set("isActive", x)} />

      <fieldset className="rounded-md border border-line p-4">
        <legend className="px-1 text-sm">Products ({v.products.length}) · the order here is the order in the store</legend>
        <div className="relative">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products to add…" aria-label="Search products to add" className="h-11 w-full rounded-md border border-line px-3 text-sm outline-none focus:border-ink" />
          {matches.length > 0 && (
            <ul className="absolute inset-x-0 top-12 z-10 max-h-72 overflow-auto rounded-md border border-line bg-surface shadow-lg">
              {matches.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => { set("products", [...v.products, p.id]); setQ(""); }} className="flex w-full justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-paper">
                    {p.name}<span className="font-mono text-xs text-muted">{p.sku}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <ol className="mt-3 max-h-[28rem] divide-y divide-line overflow-auto">
          {v.products.map((id, i) => (
            <li key={id} className="flex items-center gap-2 py-1.5 text-sm">
              <span className="w-6 text-right text-muted tabular-nums">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">{byId.get(id)?.name ?? "Unknown product"}</span>
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="flex h-9 w-9 rotate-180 items-center justify-center rounded hover:bg-sand disabled:opacity-30" aria-label="Move up"><ChevronDownIcon size={16} /></button>
              <button type="button" disabled={i === v.products.length - 1} onClick={() => move(i, 1)} className="flex h-9 w-9 items-center justify-center rounded hover:bg-sand disabled:opacity-30" aria-label="Move down"><ChevronDownIcon size={16} /></button>
              <button type="button" onClick={() => set("products", v.products.filter((x) => x !== id))} className="flex h-9 w-9 items-center justify-center rounded text-danger hover:bg-danger/10" aria-label="Remove"><CloseIcon size={16} /></button>
            </li>
          ))}
        </ol>
      </fieldset>
      <FormStatus error={error} message={null} />
      <Actions pending={pending} back={back} />
    </form>
  );
}

export type CouponValue = {
  id?: string; code: string; description: string; type: "percent" | "fixed"; value: number | string; maxDiscount: number | string; minOrder: number | string;
  startsAt: string; expiresAt: string; usageLimit: number | string; perCustomerLimit: number | string; isActive: boolean;
};

export function CouponForm({ initial, usedCount }: { initial: CouponValue; usedCount: number }) {
  const back = "/admin/coupons";
  const { v, set, submit, pending, error, fields } = useForm(initial, saveCoupon, back);
  const t = (k: Exclude<keyof CouponValue, "id" | "type" | "isActive">) => ({ name: k, value: v[k], error: fields[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value) });
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Code" {...t("code")} onChange={(e) => set("code", e.target.value.toUpperCase())} />
        <TextField label="Description (admin only)" {...t("description")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField label="Type" name="type" value={v.type} onChange={(e) => set("type", e.target.value as CouponValue["type"])}>
          <option value="percent">Percent off</option>
          <option value="fixed">Fixed amount off</option>
        </SelectField>
        <TextField label={v.type === "percent" ? "Percent" : "Amount ($)"} type="number" min={0} {...t("value")} />
        {v.type === "percent" && <TextField label="Max discount ($)" type="number" min={0} {...t("maxDiscount")} hint="Optional cap" />}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Minimum order ($)" type="number" min={0} {...t("minOrder")} />
        <TextField label="Total uses" type="number" min={0} {...t("usageLimit")} hint={`0 = unlimited · used ${usedCount}`} />
        <TextField label="Uses per customer" type="number" min={0} {...t("perCustomerLimit")} hint="0 = unlimited · by phone number" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Starts (optional)" type="datetime-local" {...t("startsAt")} />
        <TextField label="Ends" type="datetime-local" {...t("expiresAt")} />
      </div>
      <Checkbox label="Active" name="isActive" checked={v.isActive} onChange={(x) => set("isActive", x)} />
      <FormStatus error={error} message={null} />
      <Actions pending={pending} back={back} />
    </form>
  );
}

/** Amounts are shown in dollars here; the server stores cents. */
export type ZoneValue = { id?: string; name: string; fee: number | string; etaMinDays: number | string; etaMaxDays: number | string; countries: string[]; freeEligible: boolean; note: string; sortOrder: number | string; isActive: boolean };

const CODES = COUNTRIES.map((c) => c.code);

/** Country codes with suggestions ("GB", "France", "fr" all work); unknown codes are rejected by the server. */
function CountryList({ value, onChange, error }: { value: string[]; onChange: (v: string[]) => void; error?: string }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const picked = raw.split(",").map((s) => s.trim()).filter(Boolean).map((n) => COUNTRIES.find((c) => c.code === n.toUpperCase() || c.name.toLowerCase() === n.toLowerCase())?.code ?? n.toUpperCase());
    onChange([...new Set([...value, ...picked])]);
    setDraft("");
  };
  return (
    <div>
      <label htmlFor="f-countries" className="text-sm">Countries</label>
      <div className="mt-1.5 flex flex-wrap gap-2">
        <input
          id="f-countries"
          list="country-options"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder="Country name or code, then Enter"
          aria-invalid={Boolean(error)}
          className="h-11 min-w-0 flex-1 rounded-md border border-line bg-surface px-3 text-sm outline-none focus:border-ink"
        />
        <datalist id="country-options">{COUNTRIES.map((c) => <option key={c.code} value={c.name} />)}</datalist>
        <Button variant="secondary" onClick={() => add(draft)} disabled={!draft.trim()}>Add</Button>
        <Button variant="secondary" onClick={() => onChange([...new Set([...value, HOME_COUNTRY])])}>+ UK</Button>
        <Button variant="secondary" onClick={() => onChange([...new Set([...value, ...EUROPE])])}>+ Europe</Button>
        {value.length > 0 && <Button variant="secondary" onClick={() => onChange([])}>Clear</Button>}
      </div>
      {value.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {value.map((x) => (
            <li key={x} className={`flex items-center gap-1 rounded-full py-0.5 pr-1 pl-3 text-xs ${CODES.includes(x) ? "bg-sand" : "bg-danger/10 text-danger"}`}>
              {countryName(x)}
              <button type="button" onClick={() => onChange(value.filter((y) => y !== x))} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-surface" aria-label={`Remove ${countryName(x)}`}><CloseIcon size={12} /></button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

export function ZoneForm({ initial }: { initial: ZoneValue }) {
  const back = "/admin/delivery-zones";
  const { v, set, submit, pending, error, fields, run } = useForm(initial, saveZone, back);
  const router = useRouter();
  const t = (k: "name" | "fee" | "etaMinDays" | "etaMaxDays" | "sortOrder" | "note") => ({ name: k, value: v[k], error: fields[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value) });
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <TextField label="Name" {...t("name")} hint="Shown at checkout, e.g. UK Next day" />
        <TextField label="Fee ($)" type="number" min={0} step="0.01" {...t("fee")} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <TextField label="Min working days" type="number" min={0} {...t("etaMinDays")} />
        <TextField label="Max working days" type="number" min={0} {...t("etaMaxDays")} />
        <TextField label="Sort order" type="number" {...t("sortOrder")} />
      </div>
      <TextField label="Note (optional)" {...t("note")} hint="Shown under the option, e.g. Order before 2 pm" />
      <CountryList value={v.countries} onChange={(x) => set("countries", x)} error={fields.countries} />
      <p className="rounded-md bg-paper px-3 py-2 text-xs text-muted">
        Shoppers see every active option that lists their country and choose one. {!v.countries.length ? "With no countries, this option covers every country that no other option lists (rest of the world)." : ""}
      </p>
      <Checkbox label="Free when the order reaches the free-delivery threshold (Settings)" name="freeEligible" checked={v.freeEligible} onChange={(x) => set("freeEligible", x)} />
      <Checkbox label="Active" name="isActive" checked={v.isActive} onChange={(x) => set("isActive", x)} />
      <FormStatus error={error} message={null} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Actions pending={pending} back={back} />
        {v.id && (
          <Button variant="secondary" className="border-danger text-danger hover:bg-danger hover:text-paper" disabled={pending} onClick={() => window.confirm(`Delete ${v.name}?`) && run(() => deleteZone({ id: v.id }), { onOk: () => router.push(back) })}>
            Delete option
          </Button>
        )}
      </div>
    </form>
  );
}
