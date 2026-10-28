import type { Metadata } from "next";
import { site } from "@/data/site";

type Meta = { title?: string; description?: string; path?: string; image?: string; noindex?: boolean };

/** Per-page metadata: title, description, canonical, Open Graph, Twitter. */
export function buildMetadata({ title, description = site.description, path = "/", image = site.ogImage, noindex }: Meta = {}): Metadata {
  const fullTitle = title ?? `${site.name} — ${site.tagline}`;
  return {
    title: title ? title : { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: { title: fullTitle, description, url: path, siteName: site.name, locale: site.locale, type: "website", images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [image] },
    ...(noindex && { robots: { index: false, follow: false } }),
  };
}

/** Root defaults; set once in app/layout.tsx. */
export const rootMetadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
};
