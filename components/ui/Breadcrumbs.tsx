import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/data/site";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((c, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              {c.href && i < items.length - 1 ? (
                <Link href={c.href} className="hover:text-ink">{c.label}</Link>
              ) : (
                <span aria-current={i === items.length - 1 ? "page" : undefined} className="text-ink">{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.label,
            ...(c.href && { item: new URL(c.href, site.url).toString() }),
          })),
        }}
      />
    </>
  );
}
