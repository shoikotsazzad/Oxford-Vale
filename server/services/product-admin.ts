// Admin product editor: product + variants saved together, collections kept in sync both ways.
import type { z } from "zod";
import { CategoryModel, CollectionModel, OrderModel, ProductModel, VariantModel } from "@/models";
import type { productSchema } from "@/lib/validation/admin";
import { slugify } from "@/lib/slug";
import { colourHex } from "@/lib/colours";
import { toDollars } from "@/lib/money";
import { syncProductSummary } from "./catalog-sync";
import { diff, type Changes } from "./diff";
import type { ProductFormValue } from "@/components/admin/ProductForm";

export type ProductData = z.output<typeof productSchema>;
export class ProductAdminError extends Error {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

const AUDITED = ["name", "slug", "skuBase", "category", "price", "salePrice", "status", "tags", "collections", "description", "fabric", "careNotes", "seoTitle", "seoDescription"];
const code = (s: string, n: number) => s.replace(/[^a-z0-9]/gi, "").slice(0, n).toUpperCase() || "X";
export const variantSku = (skuBase: string, colour: string, size: string) => `${skuBase}-${code(colour, 3)}-${size === "One Size" ? "OS" : code(size, 6)}`;

async function uniqueSlug(base: string, exceptId?: string) {
  let candidate = base;
  for (let i = 2; await ProductModel.exists({ slug: candidate, ...(exceptId && { _id: { $ne: exceptId } }) }); i++) candidate = `${base}-${i}`;
  return candidate;
}

/** Add/remove the product from each collection's ordered list (new members go to the end). */
async function syncCollections(productId: string, before: string[], after: string[]) {
  const added = after.filter((c) => !before.includes(c));
  const removed = before.filter((c) => !after.includes(c));
  if (added.length) await CollectionModel.updateMany({ _id: { $in: added } }, { $addToSet: { products: productId } });
  if (removed.length) await CollectionModel.updateMany({ _id: { $in: removed } }, { $pull: { products: productId } });
}

export async function saveProduct(data: ProductData): Promise<{ id: string; slug: string; previousSlug?: string; created: boolean; changes: Changes; variants: { id: string; sku: string }[] }> {
  if (!(await CategoryModel.exists({ _id: data.category }))) throw new ProductAdminError("Choose a category.", { category: "Choose a category." });
  const before = data.id ? await ProductModel.findById(data.id).lean() : null;
  if (data.id && !before) throw new ProductAdminError("This product no longer exists.");
  const slug = await uniqueSlug(data.slug || slugify(data.name), data.id);

  const fields = {
    name: data.name, slug, skuBase: data.skuBase, category: data.category, collections: data.collections, tags: data.tags,
    description: data.description, fabric: data.fabric, careNotes: data.careNotes, price: data.price, salePrice: data.salePrice,
    status: data.status, sizeType: data.sizeType, seoTitle: data.seoTitle, seoDescription: data.seoDescription,
    images: data.images.map((img, i) => ({ url: img.url, alt: img.alt || data.name, sortOrder: i })),
  };
  // Every variant gets a SKU; duplicates within the form are caught before touching the DB.
  const variants = data.variants.map((v, i) => ({ ...v, sku: v.sku || variantSku(data.skuBase, v.colour, v.size), sortOrder: i }));
  const skus = variants.map((v) => v.sku);
  const dupe = skus.find((s, i) => skus.indexOf(s) !== i);
  if (dupe) throw new ProductAdminError(`Two variants share the SKU ${dupe}.`, { variants: `Two variants share the SKU ${dupe}.` });
  const taken = await VariantModel.findOne({ sku: { $in: skus }, ...(data.id && { product: { $ne: data.id } }) }).select("sku").lean();
  if (taken) throw new ProductAdminError(`SKU ${taken.sku} is used by another product.`, { variants: `SKU ${taken.sku} is used by another product.` });

  let id: string;
  if (before) {
    id = String(before._id);
    await ProductModel.updateOne({ _id: id }, data.salePrice === undefined ? { ...fields, $unset: { salePrice: 1 } } : fields);
  } else {
    id = String((await ProductModel.create(fields))._id);
  }

  // Variants: update kept rows, create new ones; removed rows are deleted, or deactivated if they were ever ordered.
  const existing = await VariantModel.find({ product: id }).select("_id").lean();
  const keep = new Set(variants.filter((v) => v.id).map((v) => v.id!));
  const dropped = existing.map((v) => String(v._id)).filter((v) => !keep.has(v));
  if (dropped.length) {
    const ordered = new Set((await OrderModel.distinct("items.variant", { "items.variant": { $in: dropped } })).map(String));
    await VariantModel.deleteMany({ _id: { $in: dropped.filter((v) => !ordered.has(v)) } });
    await VariantModel.updateMany({ _id: { $in: [...ordered] } }, { isActive: false });
  }
  // Two passes so swapping SKUs between rows can't trip the unique index.
  for (const v of variants.filter((v) => v.id)) await VariantModel.updateOne({ _id: v.id, product: id }, { sku: `${v.sku}~${v.id}` });
  const variantIds: string[] = [];
  for (const v of variants) {
    const doc = { product: id, sku: v.sku, size: v.size, colour: v.colour, colourHex: v.colourHex || colourHex(v.colour), stock: v.stock, sortOrder: v.sortOrder, isActive: v.isActive };
    const unset = v.priceOverride === undefined ? { $unset: { priceOverride: 1 } } : {};
    if (v.id) await VariantModel.updateOne({ _id: v.id, product: id }, { ...doc, ...(v.priceOverride !== undefined && { priceOverride: v.priceOverride }), ...unset });
    variantIds.push(v.id ?? String((await VariantModel.create({ ...doc, priceOverride: v.priceOverride }))._id));
  }

  await syncCollections(id, (before?.collections ?? []).map(String), data.collections);
  await syncProductSummary(id);
  const plainBefore = before ? JSON.parse(JSON.stringify(before)) : null;
  return {
    id, slug, created: !before,
    variants: variants.map((v, i) => ({ id: variantIds[i], sku: v.sku })),
    previousSlug: before && before.slug !== slug ? before.slug : undefined,
    changes: diff(plainBefore, JSON.parse(JSON.stringify(fields)), AUDITED),
  };
}

/** Copy as a draft with fresh slug/SKUs and zero stock. */
export async function duplicateProduct(id: string) {
  const src = await ProductModel.findById(id).lean();
  if (!src) throw new ProductAdminError("This product no longer exists.");
  let n = 2;
  while (await ProductModel.exists({ skuBase: `${src.skuBase}-C${n}` })) n++;
  const skuBase = `${src.skuBase}-C${n}`;
  const { _id, createdAt: _c, updatedAt: _u, ...rest } = src as typeof src & { createdAt?: Date; updatedAt?: Date };
  const copy = await ProductModel.create({ ...rest, name: `${src.name} (copy)`, slug: await uniqueSlug(`${src.slug}-copy`), skuBase, status: "draft" });
  const variants = await VariantModel.find({ product: _id }).lean();
  await VariantModel.insertMany(
    variants.map(({ _id: _v, createdAt: _vc, updatedAt: _vu, ...v }) => ({ ...v, product: copy._id, sku: variantSku(skuBase, v.colour, v.size), stock: 0 })),
  );
  await syncCollections(String(copy._id), [], (src.collections ?? []).map(String));
  await syncProductSummary(copy._id);
  return { id: String(copy._id), name: copy.name, source: src.name };
}

export async function setProductStatus(id: string, status: "draft" | "active" | "archived") {
  const before = await ProductModel.findOneAndUpdate({ _id: id }, { status }, { returnDocument: "before" }).select("name slug status").lean();
  if (!before) throw new ProductAdminError("This product no longer exists.");
  return before;
}

/** Editor data: the product as form values (or blank defaults) plus category / collection options. */
export async function productEditorData(id?: string) {
  const [categories, collections] = await Promise.all([
    CategoryModel.find().sort({ sortOrder: 1 }).select("name").lean(),
    CollectionModel.find().sort({ sortOrder: 1 }).select("name").lean(),
  ]);
  const options = {
    categories: categories.map((c) => ({ id: String(c._id), name: c.name })),
    collections: collections.map((c) => ({ id: String(c._id), name: c.name })),
  };
  if (!id) {
    const blank: ProductFormValue = {
      name: "", slug: "", skuBase: "", category: "", collections: [], tags: "", description: "", fabric: "", careNotes: "",
      price: "", salePrice: "", status: "draft", sizeType: "alpha", seoTitle: "", seoDescription: "", images: [], variants: [],
    };
    return { ...options, product: null, initial: blank };
  }
  const p = await ProductModel.findById(id).lean();
  if (!p) return null;
  const variants = await VariantModel.find({ product: id }).sort({ sortOrder: 1 }).lean();
  const initial: ProductFormValue = {
    name: p.name, slug: p.slug, skuBase: p.skuBase, category: String(p.category), collections: (p.collections ?? []).map(String), tags: (p.tags ?? []).join(", "),
    description: p.description ?? "", fabric: p.fabric ?? "", careNotes: p.careNotes ?? "", price: toDollars(p.price), salePrice: p.salePrice ? toDollars(p.salePrice) : "",
    status: p.status, sizeType: p.sizeType, seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "",
    images: [...(p.images ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map((i) => ({ url: i.url, alt: i.alt ?? "" })),
    variants: variants.map((v) => ({
      key: String(v._id), id: String(v._id), sku: v.sku, size: v.size, colour: v.colour, colourHex: v.colourHex ?? "", stock: v.stock, priceOverride: v.priceOverride ? toDollars(v.priceOverride) : "", isActive: v.isActive,
    })),
  };
  return { ...options, product: { id: String(p._id), name: p.name, slug: p.slug, status: p.status }, initial };
}
