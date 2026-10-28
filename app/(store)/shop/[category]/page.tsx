import { Suspense } from "react";
import { ListingSkeleton } from "@/components/ui/Skeleton";
import { notFound } from "next/navigation";
import { getT } from "@/server/i18n";
import { getCategoryBySlug } from "@/server/services/catalog";
import { buildMetadata } from "@/lib/seo";
import { Listing } from "@/components/store/Listing";

export async function generateMetadata({ params }: PageProps<"/shop/[category]">) {
  const category = await getCategoryBySlug((await params).category);
  if (!category) return {};
  return buildMetadata({ title: category.seoTitle || category.name, description: category.seoDescription || category.description, path: `/shop/${category.slug}` });
}

// Params and search params are read inside Suspense so navigation shows the skeleton instantly.
export default function CategoryPage(props: PageProps<"/shop/[category]">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <CategoryPageContent {...props} />
    </Suspense>
  );
}

async function CategoryPageContent({ params, searchParams }: PageProps<"/shop/[category]">) {
  const [{ category: slug }, sp, t] = await Promise.all([params, searchParams, getT()]);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  return (
    <Listing
      title={category.name}
      intro={category.description}
      crumbs={[{ label: t.common.home, href: "/" }, { label: t.nav.shopAll, href: "/shop" }, { label: category.name }]}
      pathname={`/shop/${category.slug}`}
      browse="categories"
      scope={{ category: category.id }}
      searchParams={sp}
      t={t}
    />
  );
}
