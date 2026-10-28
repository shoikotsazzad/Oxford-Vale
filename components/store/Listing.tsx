import { Suspense } from "react";
import type { Dict } from "@/lib/i18n";
import type { ProductQuery } from "@/lib/types";
import { parseListingParams, type SearchParams } from "@/lib/filters";
import { listProducts } from "@/server/services/catalog";
import { Container } from "@/components/Container";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { ProductCard } from "./ProductCard";
import { ActiveFilterChips, Filters, SortSelect } from "./Filters";
import { Pagination } from "./Pagination";
import { BrowseNav } from "./BrowseNav";

type Props = {
  title: string;
  intro?: string;
  crumbs: Crumb[];
  pathname: string;
  scope: Pick<ProductQuery, "category" | "collection" | "q">;
  /** Sibling links under the title; omitted on search. */
  browse?: "categories" | "collections";
  searchParams: SearchParams;
  t: Dict;
};

/** Product listing page body: title, filters, sort, grid, pagination. Shared by shop, category, collection and search. */
export function Listing(props: Props) {
  const { title, intro, crumbs, browse, pathname, t } = props;
  return (
    <Container className="py-8 md:py-12">
      <Breadcrumbs items={crumbs} />
      <header className="mt-4 max-w-3xl">
        <h1 className="font-serif text-4xl md:text-5xl">{title}</h1>
        {intro && <p className="mt-3 text-muted">{intro}</p>}
      </header>
      {browse && (
        <Suspense fallback={<div className="mt-6 h-10" />}>
          <BrowseNav kind={browse} pathname={pathname} t={t} />
        </Suspense>
      )}
      <Suspense key={JSON.stringify(props.searchParams)} fallback={<div className="mt-10 lg:ml-[17rem]"><ProductGridSkeleton count={8} cols="grid-cols-2 md:grid-cols-3 xl:grid-cols-4" /></div>}>
        <ListingResults {...props} />
      </Suspense>
    </Container>
  );
}

async function ListingResults({ scope, searchParams, pathname, t }: Props) {
  const filters = parseListingParams(searchParams);
  const result = await listProducts({ ...scope, ...filters });
  const active = { sizes: filters.sizes ?? [], colours: filters.colours ?? [], min: filters.min, max: filters.max, sort: filters.sort ?? "featured" };
  const countLabel = `${result.total} ${result.total === 1 ? t.listing.product : t.listing.products}`;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-8">
      <Filters facets={result.facets} active={active} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          {/* The count doubles as the h2, so product card h3s follow the page h1 in order. */}
          <h2 className="text-sm font-normal text-muted" aria-live="polite">{countLabel}</h2>
          <SortSelect value={active.sort} />
        </div>
        <div className="mt-4"><ActiveFilterChips active={active} /></div>
        {result.items.length ? (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
            {result.items.map((p, i) => <ProductCard key={p.id} product={p} t={t} priority={i < 4} sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw" />)}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState title={t.listing.noResults} text={t.listing.noResultsHint} action={<ButtonLink href="/shop" variant="secondary">{t.nav.shopAll}</ButtonLink>} />
          </div>
        )}
        <Pagination page={result.page} pages={result.pages} pathname={pathname} searchParams={searchParams} t={t} />
      </div>
    </div>
  );
}
