import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import { getCategories, getCollections } from "@/server/services/catalog";

/** Chip row under a listing title, so shoppers can jump to a sibling category or collection. */
export async function BrowseNav({ kind, pathname, t }: { kind: "categories" | "collections"; pathname: string; t: Dict }) {
  const links =
    kind === "categories"
      ? [{ name: t.nav.all, href: "/shop" }, ...(await getCategories()).map((c) => ({ name: c.name, href: `/shop/${c.slug}` }))]
      : (await getCollections()).map((c) => ({ name: c.name, href: `/collections/${c.slug}` }));
  return (
    <nav aria-label={kind === "categories" ? t.home.categories : t.nav.collections} className="-mx-4 mt-6 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 pb-1">
        {links.map((l) => {
          const active = l.href === pathname;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-10 items-center rounded-full border px-4 text-sm whitespace-nowrap transition-colors ${active ? "border-ink bg-ink text-paper" : "border-line bg-surface/60 text-ink/80 hover:border-ink hover:text-ink"}`}
              >
                {l.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
