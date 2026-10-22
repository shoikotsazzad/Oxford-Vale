import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { pages } from "@/data/pages";

// Add dynamic detail routes (e.g. /services/[slug]) here when they exist.
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.values(pages).map((p) => ({
    url: new URL(p.path, site.url).toString(),
    changeFrequency: "monthly",
    priority: p.path === "/" ? 1 : 0.7,
  }));
}
