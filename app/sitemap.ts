import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { getSitemapEntries } from "@/server/services/catalog";

const STATIC = ["/", "/shop", "/about", "/contact", "/size-guide", "/shipping-policy", "/returns-policy", "/privacy", "/terms", "/track-order"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => new URL(path, site.url).toString();
  const { products, categories, collections } = await getSitemapEntries();
  return [
    ...STATIC.map((p) => ({ url: url(p), changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.5 })),
    ...categories.map((slug) => ({ url: url(`/shop/${slug}`), changeFrequency: "daily" as const, priority: 0.8 })),
    ...collections.map((slug) => ({ url: url(`/collections/${slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: url(`/product/${p.slug}`), lastModified: p.updatedAt ?? undefined, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
