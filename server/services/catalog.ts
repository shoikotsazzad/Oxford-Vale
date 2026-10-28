import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import mongoose, { type Types } from "mongoose";
import { connectDB } from "@/server/db";
import { CategoryModel, CollectionModel, ProductModel, VariantModel, type Category, type Collection } from "@/models";
import { colourHex } from "@/lib/colours";
import type { CategoryDTO, CollectionDTO, ImageDTO, ProductCardDTO, ProductDetailDTO, ProductListResult, ProductQuery, SortKey } from "@/lib/types";

/** Every cached catalog read carries this tag; admin product/category edits call revalidateTag(CATALOG_TAG). */
export const CATALOG_TAG = "catalog";

type Filter = Record<string, unknown>;

const PER_PAGE = 24;
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "One Size"];

/** The fields toCard reads, whether or not category is populated. */
type LeanProduct = {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  category: unknown;
  price: number;
  salePrice?: number | null;
  images?: { url: string; alt?: string | null; sortOrder?: number | null }[];
  inStock: boolean;
  colours?: string[];
  tags?: string[];
};

const img = (images: { url: string; alt?: string | null }[] | undefined, i: number): ImageDTO | null =>
  images?.[i] ? { url: images[i].url, alt: images[i].alt ?? "" } : null;

function toCard(p: LeanProduct, categoryName = ""): ProductCardDTO {
  const images = [...(p.images ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return {
    id: String(p._id),
    slug: p.slug,
    name: p.name,
    category: (p.category as { name?: string } | null)?.name ?? categoryName,
    price: p.price,
    salePrice: p.salePrice ?? null,
    image: img(images, 0),
    hoverImage: img(images, 1),
    inStock: p.inStock,
    colours: p.colours ?? [],
    tags: p.tags ?? [],
  };
}

const toCategory = (c: Category & { _id: Types.ObjectId }): CategoryDTO => ({
  id: String(c._id), name: c.name, slug: c.slug, description: c.description ?? "", image: c.image ?? "", showInNav: Boolean(c.showInNav),
  seoTitle: c.seoTitle ?? "", seoDescription: c.seoDescription ?? "",
});
const toCollection = (c: Collection & { _id: Types.ObjectId }): CollectionDTO => ({
  id: String(c._id), name: c.name, slug: c.slug, description: c.description ?? "", image: c.image ?? "",
});

const sortSpec: Record<SortKey, Record<string, 1 | -1>> = {
  featured: { inStock: -1, _id: 1 },
  newest: { createdAt: -1, _id: -1 },
  "price-asc": { minPrice: 1, _id: 1 },
  "price-desc": { minPrice: -1, _id: 1 },
  name: { name: 1 },
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Every search word must match the name, fabric, tags or colour (case-insensitive, partial words allowed). */
function searchFilter(q: string): Filter {
  const words = q.trim().split(/\s+/).filter(Boolean).slice(0, 6);
  return {
    $and: words.map((w) => {
      const re = new RegExp(escapeRegex(w), "i");
      return { $or: [{ name: re }, { fabric: re }, { tags: re }, { colours: re }] };
    }),
  };
}

export async function getCategories(): Promise<CategoryDTO[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  await connectDB();
  const docs = await CategoryModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
  return docs.map(toCategory);
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDTO | null> {
  const all = await getCategories();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function getCollections(): Promise<CollectionDTO[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  await connectDB();
  const docs = await CollectionModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
  return docs.map(toCollection);
}

export async function getCollectionBySlug(slug: string): Promise<CollectionDTO | null> {
  const all = await getCollections();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function listProducts(query: ProductQuery): Promise<ProductListResult> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");
  await connectDB();

  const base: Filter = { status: "active" };
  // ObjectIds (not strings): aggregate() below does not cast like find() does.
  if (query.category) base.category = new mongoose.Types.ObjectId(query.category);
  if (query.collection) base.collections = new mongoose.Types.ObjectId(query.collection);
  if (query.q) Object.assign(base, searchFilter(query.q));

  const filter: Filter = { ...base };
  if (query.sizes?.length) filter.sizes = { $in: query.sizes };
  if (query.colours?.length) filter.colours = { $in: query.colours };
  if (query.min !== undefined || query.max !== undefined) {
    filter.minPrice = { ...(query.min !== undefined && { $gte: query.min }), ...(query.max !== undefined && { $lte: query.max }) };
  }

  const perPage = query.perPage ?? PER_PAGE;
  const total = await ProductModel.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, query.page ?? 1), pages);

  const [docs, facetRows] = await Promise.all([
    ProductModel.find(filter)
      .sort(sortSpec[query.sort ?? "featured"])
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate<{ category: Category & { _id: Types.ObjectId } }>("category", "name")
      .lean(),
    // Facets come from the unfiltered scope so customers can always widen a filter.
    ProductModel.aggregate<{ sizes: string[][]; colours: string[][]; min: number; max: number }>([
      { $match: base },
      { $group: { _id: null, sizes: { $addToSet: "$sizes" }, colours: { $addToSet: "$colours" }, min: { $min: "$minPrice" }, max: { $max: "$minPrice" } } },
    ]),
  ]);

  const f = facetRows[0];
  const rank = (size: string) => (Number.isNaN(Number(size)) ? 1000 + SIZE_ORDER.indexOf(size) : Number(size));
  const sizes = [...new Set((f?.sizes ?? []).flat())].sort((a, b) => rank(a) - rank(b));
  const colours = [...new Set((f?.colours ?? []).flat())].sort().map((name) => ({ name, hex: colourHex(name) }));

  return {
    items: docs.map((d) => toCard(d as unknown as LeanProduct)),
    total,
    page,
    pages,
    facets: { sizes, colours, minPrice: f?.min ?? 0, maxPrice: f?.max ?? 0 },
  };
}

/** Products of a collection in the order the admin set on the collection. */
export async function getCollectionProducts(slug: string, limit = 10): Promise<ProductCardDTO[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  await connectDB();
  const col = await CollectionModel.findOne({ slug, isActive: true }).select("products").lean();
  if (!col) return [];
  const ids = col.products.slice(0, limit * 2).map(String);
  const docs = await ProductModel.find({ _id: { $in: ids }, status: "active" })
    .populate<{ category: Category & { _id: Types.ObjectId } }>("category", "name")
    .lean();
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  return ids.flatMap((id) => (byId.has(id) ? [toCard(byId.get(id) as unknown as LeanProduct)] : [])).slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<ProductDetailDTO | null> {
  "use cache";
  cacheTag(CATALOG_TAG, `product:${slug}`);
  cacheLife("minutes");
  await connectDB();
  const p = await ProductModel.findOne({ slug, status: "active" })
    .populate<{ category: Category & { _id: Types.ObjectId } }>("category")
    .populate<{ collections: (Collection & { _id: Types.ObjectId })[] }>("collections", "name slug isActive")
    .lean();
  if (!p) return null;
  const variants = await VariantModel.find({ product: p._id, isActive: true }).sort({ sortOrder: 1 }).lean();
  const base = p.salePrice ?? p.price;
  const images = [...(p.images ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map((i) => ({ url: i.url, alt: i.alt ?? p.name }));
  return {
    ...toCard(p as unknown as LeanProduct),
    skuBase: p.skuBase,
    description: p.description ?? "",
    fabric: p.fabric ?? "",
    careNotes: p.careNotes ?? "",
    images,
    sizeType: p.sizeType,
    categorySlug: p.category.slug,
    categoryId: String(p.category._id),
    collections: p.collections.filter((c) => c.isActive).map((c) => ({ name: c.name, slug: c.slug })),
    variants: variants.map((v) => ({
      id: String(v._id), sku: v.sku, size: v.size, colour: v.colour, colourHex: v.colourHex ?? colourHex(v.colour), stock: v.stock, price: v.priceOverride ?? base,
    })),
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
  };
}

/** Same category first, then same collection, excluding the product itself. */
export async function getRelatedProducts(productId: string, categoryId: string, limit = 5): Promise<ProductCardDTO[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  await connectDB();
  const docs = await ProductModel.find({ status: "active", category: categoryId, _id: { $ne: productId } })
    .sort({ inStock: -1, _id: 1 })
    .limit(limit)
    .populate<{ category: Category & { _id: Types.ObjectId } }>("category", "name")
    .lean();
  return docs.map((d) => toCard(d as unknown as LeanProduct));
}

export type Suggestion = { slug: string; name: string; category: string; price: number; salePrice: number | null; image: string | null };

export async function suggestProducts(q: string, limit = 6): Promise<Suggestion[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");
  if (q.trim().length < 2) return [];
  await connectDB();
  const docs = await ProductModel.find({ status: "active", ...searchFilter(q) })
    .sort({ inStock: -1, name: 1 })
    .limit(limit)
    .select("slug name price salePrice images category")
    .populate<{ category: Category }>("category", "name")
    .lean();
  return docs.map((d) => ({
    slug: d.slug, name: d.name, category: d.category?.name ?? "", price: d.price, salePrice: d.salePrice ?? null, image: d.images?.[0]?.url ?? null,
  }));
}

/** Slugs for the sitemap. */
export async function getSitemapEntries() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  await connectDB();
  const [products, categories, collections] = await Promise.all([
    ProductModel.find({ status: "active" }).select("slug updatedAt").lean(),
    CategoryModel.find({ isActive: true }).select("slug").lean(),
    CollectionModel.find({ isActive: true }).select("slug").lean(),
  ]);
  return {
    products: products.map((p) => ({ slug: p.slug, updatedAt: (p as { updatedAt?: Date }).updatedAt?.toISOString() ?? null })),
    categories: categories.map((c) => c.slug),
    collections: collections.map((c) => c.slug),
  };
}

/** Products with a sale price, for the home page "On sale" row. */
export async function getSaleProducts(limit = 10): Promise<ProductCardDTO[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  await connectDB();
  const docs = await ProductModel.find({ status: "active", inStock: true, salePrice: { $gt: 0 } })
    .sort(sortSpec.featured)
    .limit(limit)
    .populate<{ category: Category & { _id: Types.ObjectId } }>("category", "name")
    .lean();
  return docs.map((d) => toCard(d as unknown as LeanProduct));
}

/** Cards for products named in data files (home "Shop the look"), in the given order; unknown slugs are skipped. */
export async function getProductCardsBySlugs(slugs: string[]): Promise<ProductCardDTO[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  await connectDB();
  const docs = await ProductModel.find({ slug: { $in: slugs }, status: "active" })
    .populate<{ category: Category & { _id: Types.ObjectId } }>("category", "name")
    .lean();
  const bySlug = new Map(docs.map((d) => [d.slug, d]));
  return slugs.flatMap((s) => (bySlug.has(s) ? [toCard(bySlug.get(s) as unknown as LeanProduct)] : []));
}

/** Cards for specific products (wishlist), in the given order. Not cached: per-user. */
export async function getProductCardsByIds(ids: string[]): Promise<ProductCardDTO[]> {
  if (!ids.length) return [];
  await connectDB();
  const docs = await ProductModel.find({ _id: { $in: ids }, status: "active" })
    .populate<{ category: Category & { _id: Types.ObjectId } }>("category", "name")
    .lean();
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  return ids.flatMap((id) => (byId.has(id) ? [toCard(byId.get(id) as unknown as LeanProduct)] : []));
}
