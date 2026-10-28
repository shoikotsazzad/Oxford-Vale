import { Suspense } from "react";
import { ListingSkeleton } from "@/components/ui/Skeleton";
import { getT } from "@/server/i18n";
import { buildMetadata } from "@/lib/seo";
import { Listing } from "@/components/store/Listing";

export const metadata = buildMetadata({
  title: "Shop Men's Clothing",
  description: "Browse every Oxford Vale piece: suits, blazers, overcoats, shirts, knitwear, caps and leather shoes. Filter by size, colour and price.",
  path: "/shop",
});

// Params and search params are read inside Suspense so navigation shows the skeleton instantly.
export default function ShopPage(props: PageProps<"/shop">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <ShopPageContent {...props} />
    </Suspense>
  );
}

async function ShopPageContent({ searchParams }: PageProps<"/shop">) {
  const [t, sp] = await Promise.all([getT(), searchParams]);
  return (
    <Listing
      title={t.nav.shopAll}
      crumbs={[{ label: t.common.home, href: "/" }, { label: t.nav.shopAll }]}
      pathname="/shop"
      browse="categories"
      scope={{}}
      searchParams={sp}
      t={t}
    />
  );
}
