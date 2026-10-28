import { getT } from "@/server/i18n";
import { getSettings } from "@/server/services/settings";
import { getCategories, getCollectionProducts, getCollections, getProductCardsBySlugs, getSaleProducts } from "@/server/services/catalog";
import { buildMetadata } from "@/lib/seo";
import { bestOfCollection, categoryBand, collectionTiles, newArrivalsCollection, shopTheLook } from "@/data/home";
import { Hero } from "@/components/store/Hero";
import { Ticker } from "@/components/store/Ticker";
import { CategoryBand } from "@/components/store/CategoryBand";
import { NewSeasonBanner } from "@/components/store/NewSeasonBanner";
import { CollectionMosaic } from "@/components/store/CollectionMosaic";
import { FeatureBar } from "@/components/store/FeatureBar";
import { ProductRow } from "@/components/store/ProductRow";
import { ShopTheLook } from "@/components/store/ShopTheLook";
import { StyleHelp } from "@/components/store/StyleHelp";

export const metadata = buildMetadata({
  description: "Shop English heritage menswear in Bangladesh: tailored suits, overcoats, tweed caps, shirts and leather shoes. Cash on delivery, bKash and Nagad, delivery across Bangladesh.",
});

export default async function HomePage() {
  const [t, settings, categories, collections, newArrivals, bestOf, look, onSale] = await Promise.all([
    getT(),
    getSettings(),
    getCategories(),
    getCollections(),
    getCollectionProducts(newArrivalsCollection, 12),
    getCollectionProducts(bestOfCollection, 10),
    getProductCardsBySlugs(shopTheLook.products),
    getSaleProducts(5),
  ]);
  const band = categoryBand.flatMap((b) => {
    const c = categories.find((x) => x.slug === b.slug);
    return c ? [{ ...c, line: b.line }] : [];
  });
  const tiles = collectionTiles.flatMap((b) => {
    const c = collections.find((x) => x.slug === b.slug);
    return c ? [{ ...c, line: b.line }] : [];
  });

  return (
    <>
      <Hero hero={settings.hero} t={t} />
      <Ticker items={t.home.ticker} />
      <CategoryBand items={band} t={t} />
      <ProductRow title={t.home.newArrivals} intro={t.home.newArrivalsText} href={`/collections/${newArrivalsCollection}`} products={newArrivals} t={t} layout="carousel" />
      <NewSeasonBanner banner={settings.newSeasonBanner} />
      <CollectionMosaic items={tiles} t={t} />
      <FeatureBar t={t} />
      <ProductRow title={t.home.bestOf} href={`/collections/${bestOfCollection}`} products={bestOf} t={t} />
      <ShopTheLook look={shopTheLook} products={look} t={t} />
      <ProductRow title={t.home.onSale} products={onSale} t={t} />
      <StyleHelp whatsapp={settings.contact.whatsapp} t={t} />
    </>
  );
}
