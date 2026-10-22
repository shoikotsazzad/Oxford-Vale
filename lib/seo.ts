import type { Metadata } from "next";
import { site } from "@/data/site";
import { pages, type PageKey } from "@/data/pages";

type Overrides = { title?: string; description?: string; path?: string; image?: string };

/** Per-page metadata: title, description, canonical, Open Graph, Twitter. */
export function buildMetadata(key: PageKey | null, o: Overrides = {}): Metadata {
  const page = key ? pages[key] : null;
  const title = o.title ?? page?.title ?? site.name;
  const description = o.description ?? page?.description ?? site.description;
  const path = o.path ?? page?.path ?? "/";
  const image = o.image ?? site.ogImage;

  return {
    // Home title is used as-is; other pages get "| Business" via the root template.
    title: key === "home" ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: site.name,
      locale: site.locale,
      type: "website",
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/** Root defaults; set once in app/layout.tsx. */
export const rootMetadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
};
