import { Suspense } from "react";
import { ListingSkeleton } from "@/components/ui/Skeleton";
import { getT } from "@/server/i18n";
import { buildMetadata } from "@/lib/seo";
import { Listing } from "@/components/store/Listing";
import { Container } from "@/components/Container";
import { SearchPanel } from "@/components/store/SearchPanel";

export const metadata = buildMetadata({ title: "Search", path: "/search", noindex: true });

// Params and search params are read inside Suspense so navigation shows the skeleton instantly.
export default function SearchPage(props: PageProps<"/search">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <SearchPageContent {...props} />
    </Suspense>
  );
}

async function SearchPageContent({ searchParams }: PageProps<"/search">) {
  const [t, sp] = await Promise.all([getT(), searchParams]);
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 80) ?? "";
  if (q.length < 2) {
    return (
      <Container className="max-w-3xl py-16">
        <h1 className="font-serif text-4xl">{t.search.title}</h1>
        <div className="mt-8"><SearchPanel autoFocus /></div>
        <p className="mt-6 text-sm text-muted">{t.search.empty}</p>
      </Container>
    );
  }
  return (
    <Listing
      title={`${t.search.resultsFor} “${q}”`}
      crumbs={[{ label: t.common.home, href: "/" }, { label: t.search.title }]}
      pathname="/search"
      scope={{ q }}
      searchParams={sp}
      t={t}
    />
  );
}
