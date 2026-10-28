import { getCategories, getCollections } from "@/server/services/catalog";
import type { StoreSettings } from "@/lib/types";
import { HeaderClient } from "./HeaderClient";

export async function Header({ settings }: { settings: StoreSettings }) {
  const [categories, collections] = await Promise.all([getCategories(), getCollections()]);
  return (
    <HeaderClient
      storeName={settings.storeName}
      tagline={settings.tagline}
      navLinks={categories.filter((c) => c.showInNav).map((c) => ({ name: c.name, href: `/shop/${c.slug}` }))}
      allCategories={categories.map((c) => ({ name: c.name, href: `/shop/${c.slug}` }))}
      collections={collections.map((c) => ({ name: c.name, href: `/collections/${c.slug}` }))}
    />
  );
}

export function HeaderSkeleton() {
  return <div className="sticky top-0 z-40 h-16 border-b border-line bg-paper md:h-20" />;
}
