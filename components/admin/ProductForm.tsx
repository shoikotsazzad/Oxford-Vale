"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SelectField, TextArea, TextField } from "@/components/ui/Field";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlusIcon } from "@/components/ui/icons";
import { saveProductAction, uploadProductImage } from "@/server/actions/admin/catalog";
import { sizeTypeLabel } from "@/lib/size-ranges";
import { isPlaceholder } from "@/lib/images";
import { SIZE_TYPES, type SizeType } from "@/models/enums";
import { FormStatus, useAdminAction } from "./useAdminAction";

export type VariantRow = { key: string; id?: string; sku: string; size: string; colour: string; colourHex: string; stock: number | string; priceOverride: number | string; isActive: boolean };
export type ProductFormValue = {
  name: string; slug: string; skuBase: string; category: string; collections: string[]; tags: string;
  description: string; fabric: string; careNotes: string; price: number | string; salePrice: number | string;
  status: "draft" | "active" | "archived"; sizeType: SizeType; seoTitle: string; seoDescription: string;
  images: { url: string; alt: string }[]; variants: VariantRow[];
};
type Option = { id: string; name: string };

let seq = 0;
const newKey = () => `new-${++seq}`;
const input = "h-10 rounded-md border border-line bg-surface px-2 text-sm outline-none focus:border-ink disabled:bg-paper";
const cell = `${input} w-full`;

export function ProductForm({ id, initial, categories, collections, readOnly }: { id?: string; initial: ProductFormValue; categories: Option[]; collections: Option[]; readOnly: boolean }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [bulk, setBulk] = useState({ sizes: "", colour: initial.variants[0]?.colour ?? "", stock: "0" });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { run, pending, error, fields, message, clear } = useAdminAction();

  const set = <K extends keyof ProductFormValue>(k: K, value: ProductFormValue[K]) => {
    setV((p) => ({ ...p, [k]: value }));
    clear(k);
  };
  const text = (k: "name" | "slug" | "skuBase" | "description" | "fabric" | "careNotes" | "seoTitle" | "seoDescription" | "tags" | "price" | "salePrice") =>
    ({ name: k, value: v[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value), error: fields[k], disabled: readOnly });
  const setVariant = (i: number, patch: Partial<VariantRow>) => setV((p) => ({ ...p, variants: p.variants.map((row, j) => (j === i ? { ...row, ...patch } : row)) }));
  const moveImage = (i: number, d: -1 | 1) =>
    setV((p) => {
      const images = [...p.images];
      [images[i], images[i + d]] = [images[i + d], images[i]];
      return { ...p, images };
    });

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError(null);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadProductImage(fd).catch(() => null);
      if (res?.ok) setV((p) => ({ ...p, images: [...p.images, { url: res.data.url, alt: p.name }] }));
      else setUploadError(res && !res.ok ? res.error.message : "Upload failed. Try again.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function addSizes() {
    const sizes = bulk.sizes.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    if (!sizes.length || !bulk.colour.trim()) return;
    const have = new Set(v.variants.map((r) => `${r.size}|${r.colour}`.toLowerCase()));
    const rows = sizes
      .filter((s) => !have.has(`${s}|${bulk.colour.trim()}`.toLowerCase()))
      .map((size) => ({ key: newKey(), sku: "", size, colour: bulk.colour.trim(), colourHex: "", stock: bulk.stock, priceOverride: "", isActive: true }));
    setV((p) => ({ ...p, variants: [...p.variants, ...rows] }));
    setBulk((b) => ({ ...b, sizes: "" }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    const payload = {
      ...v,
      id,
      tags: v.tags.split(",").map((t) => t.trim()).filter(Boolean),
      variants: v.variants.map(({ key: _k, ...row }) => row),
    };
    run(() => saveProductAction(payload), {
      success: "Saved. The store shows the change right away.",
      onOk: (d) => {
        if (!id) router.replace(`/admin/products/${d.id}`);
        // Adopt server ids/SKUs so the next save updates these rows instead of creating them again.
        else setV((p) => ({ ...p, slug: d.slug, variants: p.variants.map((r, i) => ({ ...r, ...d.variants[i] })) }));
      },
    });
  }

  const variantError = (i: number) => Object.entries(fields).find(([k]) => k.startsWith(`variants.${i}.`))?.[1];
  const totalStock = v.variants.reduce((n, r) => n + (Number(r.stock) || 0), 0);

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <div className="min-w-0 space-y-6">
        <section className="space-y-4 rounded-lg border border-line bg-surface p-5">
          <TextField label="Name" {...text("name")} required />
          <TextArea label="Description" rows={6} {...text("description")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Fabric" {...text("fabric")} placeholder="e.g. 100% wool" />
            <TextField label="Tags (comma separated)" {...text("tags")} placeholder="Heritage, Winter" />
          </div>
          <TextArea label="Care notes" rows={3} {...text("careNotes")} />
        </section>

        <section className="rounded-lg border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Photos</h2>
            <p className="text-xs text-muted">First photo is the main image, second shows on hover. Uploads are cropped to 4:5.</p>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {v.images.map((img, i) => (
              <li key={img.url} className="rounded-md border border-line p-2">
                <div className="relative aspect-[4/5] overflow-hidden rounded bg-sand">
                  <Image src={img.url} alt={img.alt} fill sizes="160px" className="object-cover" unoptimized={isPlaceholder(img.url)} />
                  {i === 0 && <span className="label absolute top-1 left-1 rounded bg-ink px-1.5 py-0.5 text-[10px] text-paper">Main</span>}
                </div>
                <input
                  aria-label={`Alt text for photo ${i + 1}`}
                  value={img.alt}
                  disabled={readOnly}
                  onChange={(e) => set("images", v.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                  placeholder="Alt text"
                  className={`${cell} mt-2 h-9 text-xs`}
                />
                {!readOnly && (
                  <div className="mt-1 flex justify-between">
                    <button type="button" disabled={i === 0} onClick={() => moveImage(i, -1)} className="flex h-9 w-9 items-center justify-center rounded hover:bg-sand disabled:opacity-30" aria-label="Move earlier"><ChevronLeftIcon size={16} /></button>
                    <button type="button" onClick={() => set("images", v.images.filter((_, j) => j !== i))} className="flex h-9 w-9 items-center justify-center rounded text-danger hover:bg-danger/10" aria-label="Remove photo"><CloseIcon size={16} /></button>
                    <button type="button" disabled={i === v.images.length - 1} onClick={() => moveImage(i, 1)} className="flex h-9 w-9 items-center justify-center rounded hover:bg-sand disabled:opacity-30" aria-label="Move later"><ChevronRightIcon size={16} /></button>
                  </div>
                )}
              </li>
            ))}
            {!readOnly && v.images.length < 12 && (
              <li>
                <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line text-sm text-muted hover:border-ink hover:text-ink">
                  <PlusIcon />
                  {uploading ? "Uploading…" : "Add photos"}
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={uploading} onChange={(e) => upload(e.target.files)} />
                </label>
              </li>
            )}
          </ul>
          {uploadError && <p role="alert" className="mt-3 text-sm text-danger">{uploadError}</p>}
          {fields.images && <p className="mt-3 text-sm text-danger">{fields.images}</p>}
        </section>

        <section className="rounded-lg border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Sizes, colours &amp; stock</h2>
            <p className="text-xs text-muted">{v.variants.length} variant{v.variants.length === 1 ? "" : "s"} · {totalStock} in stock. SKUs fill in automatically when left empty.</p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="w-24 pb-2 font-normal">Size</th>
                  <th className="w-36 pb-2 font-normal">Colour</th>
                  <th className="pb-2 font-normal">SKU</th>
                  <th className="w-24 pb-2 font-normal">Stock</th>
                  <th className="w-28 pb-2 font-normal">Price override</th>
                  <th className="w-16 pb-2 text-center font-normal">On sale</th>
                  <th className="w-10 pb-2" />
                </tr>
              </thead>
              <tbody>
                {v.variants.map((row, i) => (
                  <tr key={row.key} className="align-top">
                    <td className="py-1 pr-2"><input aria-label="Size" value={row.size} disabled={readOnly} onChange={(e) => setVariant(i, { size: e.target.value })} className={cell} /></td>
                    <td className="py-1 pr-2"><input aria-label="Colour" value={row.colour} disabled={readOnly} onChange={(e) => setVariant(i, { colour: e.target.value })} className={cell} /></td>
                    <td className="py-1 pr-2"><input aria-label="SKU" value={row.sku} disabled={readOnly} onChange={(e) => setVariant(i, { sku: e.target.value.toUpperCase() })} placeholder="auto" className={`${cell} font-mono text-xs`} /></td>
                    <td className="py-1 pr-2"><input aria-label="Stock" type="number" min={0} inputMode="numeric" value={row.stock} disabled={readOnly} onChange={(e) => setVariant(i, { stock: e.target.value })} className={`${cell} tabular-nums ${Number(row.stock) === 0 ? "text-danger" : ""}`} /></td>
                    <td className="py-1 pr-2"><input aria-label="Price override ($)" type="number" min={0} step="0.01" inputMode="decimal" value={row.priceOverride} disabled={readOnly} onChange={(e) => setVariant(i, { priceOverride: e.target.value })} placeholder="—" className={`${cell} tabular-nums`} /></td>
                    <td className="py-1 text-center"><input aria-label="Available" type="checkbox" checked={row.isActive} disabled={readOnly} onChange={(e) => setVariant(i, { isActive: e.target.checked })} className="mt-2.5 h-5 w-5 accent-ink" /></td>
                    <td className="py-1">
                      {!readOnly && (
                        <button type="button" onClick={() => set("variants", v.variants.filter((_, j) => j !== i))} className="flex h-10 w-10 items-center justify-center rounded text-danger hover:bg-danger/10" aria-label={`Remove ${row.size} ${row.colour}`}>
                          <CloseIcon size={16} />
                        </button>
                      )}
                      {variantError(i) && <span className="sr-only">{variantError(i)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {Object.entries(fields).filter(([k]) => k.startsWith("variants")).slice(0, 3).map(([k, msg]) => (
            <p key={k} className="mt-2 text-sm text-danger">{k === "variants" ? msg : `Row ${Number(k.split(".")[1]) + 1}: ${msg}`}</p>
          ))}
          {!readOnly && (
            <div className="mt-4 flex flex-wrap items-end gap-3 rounded-md bg-paper p-3">
              <label className="text-xs text-muted">Add sizes<input value={bulk.sizes} onChange={(e) => setBulk({ ...bulk, sizes: e.target.value })} placeholder="38, 40, 42 or S, M, L" className={`${input} mt-1 block w-48`} /></label>
              <label className="text-xs text-muted">Colour<input value={bulk.colour} onChange={(e) => setBulk({ ...bulk, colour: e.target.value })} className={`${input} mt-1 block w-32`} /></label>
              <label className="text-xs text-muted">Stock each<input type="number" min={0} value={bulk.stock} onChange={(e) => setBulk({ ...bulk, stock: e.target.value })} className={`${input} mt-1 block w-24`} /></label>
              <Button variant="secondary" onClick={addSizes} disabled={!bulk.sizes.trim() || !bulk.colour.trim()}>Add</Button>
            </div>
          )}
        </section>
      </div>

      <div className="min-w-0 space-y-6">
        <section className="space-y-4 rounded-lg border border-line bg-surface p-5 xl:sticky xl:top-6">
          <SelectField label="Status" name="status" value={v.status} disabled={readOnly} onChange={(e) => set("status", e.target.value as ProductFormValue["status"])} hint="Only active products appear in the store.">
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </SelectField>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Price ($)" type="number" min={0} step="0.01" inputMode="decimal" {...text("price")} />
            <TextField label="Sale price ($)" type="number" min={0} step="0.01" inputMode="decimal" {...text("salePrice")} hint="Leave empty if not on sale" />
          </div>
          <SelectField label="Category" name="category" value={v.category} disabled={readOnly} error={fields.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">Choose…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
          <fieldset>
            <legend className="text-sm">Collections</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {collections.map((c) => {
                const on = v.collections.includes(c.id);
                return (
                  <label key={c.id} className={`flex min-h-9 cursor-pointer items-center rounded-full border px-3 text-sm ${on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"} ${readOnly ? "pointer-events-none" : ""}`}>
                    <input type="checkbox" className="sr-only" checked={on} disabled={readOnly} onChange={() => set("collections", on ? v.collections.filter((x) => x !== c.id) : [...v.collections, c.id])} />
                    {c.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="SKU base" {...text("skuBase")} placeholder="OV-SUT-001" />
            <SelectField label="Size type" name="sizeType" value={v.sizeType} disabled={readOnly} onChange={(e) => set("sizeType", e.target.value as SizeType)}>
              {SIZE_TYPES.map((s) => <option key={s} value={s}>{sizeTypeLabel[s]}</option>)}
            </SelectField>
          </div>
          <TextField label="URL slug" {...text("slug")} hint="Leave empty to build it from the name" />
          <details className="rounded-md border border-line p-3">
            <summary className="cursor-pointer text-sm">Search engine listing</summary>
            <div className="mt-3 space-y-4">
              <TextField label="SEO title" {...text("seoTitle")} hint={`${v.seoTitle.length}/70 · defaults to the product name`} />
              <TextArea label="SEO description" rows={3} {...text("seoDescription")} hint={`${v.seoDescription.length}/170 · defaults to the description`} />
            </div>
          </details>
          <FormStatus error={error} message={message} />
          {!readOnly && <Button type="submit" className="w-full" disabled={pending || uploading}>{pending ? "Saving…" : id ? "Save changes" : "Create product"}</Button>}
        </section>
      </div>
    </form>
  );
}
