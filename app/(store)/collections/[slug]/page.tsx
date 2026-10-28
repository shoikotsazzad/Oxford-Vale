import { Suspense } from "react";
import { ListingSkeleton } from "@/components/ui/Skeleton";
import { notFound } from "next/navigation";
import { getT } from "@/server/i18n";
import { getCollectionBySlug } from "@/server/services/catalog";
import { buildMetadata } from "@/lib/seo";
import { Listing } from "@/components/store/Listing";

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">) {
  const collection = await getCollectionBySlug((await params).slug);
  if (!collection) return {};
  return buildMetadata({ title: collection.name, description: `${collection.description} Shop the ${collection.name} collection at Oxford Vale.`, path: `/collections/${collection.slug}` });
}

// Params and search params are read inside Suspense so navigation shows the skeleton instantly.
export default function CollectionPage(props: PageProps<"/collections/[slug]">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <CollectionPageContent {...props} />
    </Suspense>
  );
}

async function CollectionPageContent({ params, searchParams }: PageProps<"/collections/[slug]">) {
  const [{ slug }, sp, t] = await Promise.all([params, searchParams, getT()]);
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();
  return (
    <Listing
      title={collection.name}
      intro={collection.description}
      crumbs={[{ label: t.common.home, href: "/" }, { label: t.nav.collections }, { label: collection.name }]}
      pathname={`/collections/${collection.slug}`}
      browse="collections"
      scope={{ collection: collection.id }}
      searchParams={sp}
      t={t}
    />
  );
}
