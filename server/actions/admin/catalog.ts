"use server";
import { z } from "zod";
import { adminAction } from "@/server/admin/guard";
import { revalidateStore } from "@/server/admin/revalidate";
import { audit, diff } from "@/server/services/audit";
import { duplicateProduct, saveProduct, setProductStatus } from "@/server/services/product-admin";
import { saveProductImage } from "@/server/storage";
import { cleanText } from "@/server/sanitize";
import { ok } from "@/server/result";
import { CategoryModel, CollectionModel, ProductModel } from "@/models";
import { slugify } from "@/lib/slug";
import { categorySchema, collectionSchema, idSchema, productSchema, productStatusSchema } from "@/lib/validation/admin";

const MULTILINE = new Set(["description", "careNotes"]);
const clean = <T extends Record<string, unknown>>(o: T): T =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "string" ? cleanText(v, { multiline: MULTILINE.has(k) }) : v])) as T;

export async function saveProductAction(input: unknown) {
  return adminAction("catalog.edit", productSchema, input, async (d, admin) => {
    const res = await saveProduct({
      ...clean(d),
      tags: d.tags.map((t) => cleanText(t)),
      images: d.images.map((i) => ({ url: i.url, alt: cleanText(i.alt) })),
      variants: d.variants.map((v) => ({ ...v, size: cleanText(v.size), colour: cleanText(v.colour) })),
    });
    await audit(admin, res.created ? "product.create" : "product.update", { type: "product", id: res.id, label: d.name }, res.changes);
    revalidateStore("catalog");
    return ok({ id: res.id, slug: res.slug, variants: res.variants });
  });
}

export async function uploadProductImage(form: FormData) {
  return adminAction("catalog.edit", z.object({ file: z.instanceof(File, { message: "Choose an image." }) }), { file: form.get("file") }, async (d, admin) => {
    const url = await saveProductImage(d.file);
    await audit(admin, "media.upload", { type: "media", id: url, label: d.file.name.slice(0, 80) });
    return ok({ url });
  });
}

export async function duplicateProductAction(input: unknown) {
  return adminAction("catalog.edit", idSchema, input, async (d, admin) => {
    const copy = await duplicateProduct(d.id);
    await audit(admin, "product.duplicate", { type: "product", id: copy.id, label: copy.name }, { source: { from: null, to: copy.source } });
    revalidateStore("catalog");
    return ok({ id: copy.id });
  });
}

export async function setProductStatusAction(input: unknown) {
  return adminAction("catalog.edit", productStatusSchema, input, async (d, admin) => {
    const before = await setProductStatus(d.id, d.status);
    await audit(admin, d.status === "archived" ? "product.archive" : "product.status", { type: "product", id: d.id, label: before.name }, { status: { from: before.status, to: d.status } });
    revalidateStore("catalog");
    return ok(null);
  });
}

const CATEGORY_FIELDS = ["name", "slug", "description", "image", "sortOrder", "isActive", "showInNav", "seoTitle", "seoDescription"];

export async function saveCategory(input: unknown) {
  return adminAction("catalog.edit", categorySchema, input, async (d, admin) => {
    const { id, ...fields } = clean(d);
    fields.slug = fields.slug || slugify(fields.name);
    const before = id ? await CategoryModel.findById(id).lean() : null;
    const saved = id ? await CategoryModel.findByIdAndUpdate(id, fields, { returnDocument: "after" }).lean() : (await CategoryModel.create(fields)).toObject();
    if (!saved) return ok({ id: "" });
    await audit(admin, id ? "category.update" : "category.create", { type: "category", id: String(saved._id), label: saved.name }, diff(before && JSON.parse(JSON.stringify(before)), fields, CATEGORY_FIELDS));
    revalidateStore("catalog");
    return ok({ id: String(saved._id) });
  });
}

export async function saveCollection(input: unknown) {
  return adminAction("catalog.edit", collectionSchema, input, async (d, admin) => {
    const { id, products, ...rest } = clean(d);
    const fields = { ...rest, slug: rest.slug || slugify(rest.name), products: [...new Set(products)] };
    const before = id ? await CollectionModel.findById(id).lean() : null;
    const saved = id ? await CollectionModel.findByIdAndUpdate(id, fields, { returnDocument: "after" }).lean() : (await CollectionModel.create(fields)).toObject();
    if (!saved) return ok({ id: "" });
    // Keep Product.collections (used by filters) in step with the ordered list.
    await ProductModel.updateMany({ _id: { $in: fields.products } }, { $addToSet: { collections: saved._id } });
    await ProductModel.updateMany({ collections: saved._id, _id: { $nin: fields.products } }, { $pull: { collections: saved._id } });
    const plainBefore = before && JSON.parse(JSON.stringify(before));
    await audit(admin, id ? "collection.update" : "collection.create", { type: "collection", id: String(saved._id), label: saved.name }, diff(plainBefore, fields, ["name", "slug", "description", "image", "sortOrder", "isActive", "products"]));
    revalidateStore("catalog");
    return ok({ id: String(saved._id) });
  });
}
