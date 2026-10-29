import { connection } from "next/server";
import { getT } from "@/server/i18n";
import { getSettings } from "@/server/services/settings";
import { getCategories, getCollectionProducts, getCollections, getProductCardsBySlugs, getSaleProducts } from "@/server/services/catalog";
import { buildMetadata } from "@/lib/seo";
import { bestOfCollection, categoryBand, collectionTiles, homeOffer, newArrivalsCollection, shopTheLook } from "@/data/home";
import { getPublicOffer } from "@/server/services/coupon";
import { getCurrentUser } from "@/server/auth/session";
import { MobileWelcome } from "@/components/store/MobileWelcome";
import { Hero } from "@/components/store/Hero";
import { OfferCard } from "@/components/store/OfferCard";
import { Ticker } from "@/components/store/Ticker";
import { CategoryBand } from "@/components/store/CategoryBand";
import { NewSeasonBanner } from "@/components/store/NewSeasonBanner";
import { CollectionMosaic } from "@/components/store/CollectionMosaic";
import { FeatureBar } from "@/components/store/FeatureBar";
import { ProductRow } from "@/components/store/ProductRow";
import { ShopTheLook } from "@/components/store/ShopTheLook";
import { StyleHelp } from "@/components/store/StyleHelp";

export const metadata = buildMetadata({
  description: "English heritage menswear from Savile Row, London: tailored suits, overcoats, tweed caps, shirts and leather shoes. Free UK delivery over $125, free 30-day UK returns, worldwide shipping.",
});

export default async function HomePage() {
  await connection(); // the offer card checks the coupon's dates now, and the greeting uses the signed-in user
  const [t, settings, categories, collections, newArrivals, bestOf, look, onSale, offer, user] = await Promise.all([
    getT(),
    getSettings(),
    getCategories(),
    getCollections(),
    getCollectionProducts(newArrivalsCollection, 12),
    getCollectionProducts(bestOfCollection, 10),
    getProductCardsBySlugs(shopTheLook.products),
    getSaleProducts(5),
    getPublicOffer(homeOffer.code),
    getCurrentUser(),
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
      <MobileWelcome firstName={user?.name.split(" ")[0]} />
      <Hero hero={settings.hero} t={t} />
      <Ticker items={t.home.ticker} />
      <CategoryBand items={band} t={t} />
      <ProductRow title={t.home.newArrivals} intro={t.home.newArrivalsText} href={`/collections/${newArrivalsCollection}`} products={newArrivals} t={t} layout="carousel" />
      {offer && <OfferCard offer={offer} image={homeOffer.image} />}
      <NewSeasonBanner banner={settings.newSeasonBanner} />
      <CollectionMosaic items={tiles} t={t} />
      <FeatureBar t={t} freeOver={settings.freeDeliveryThreshold} />
      <ProductRow title={t.home.bestOf} href={`/collections/${bestOfCollection}`} products={bestOf} t={t} />
      <ShopTheLook look={shopTheLook} products={look} t={t} />
      <ProductRow title={t.home.onSale} products={onSale} t={t} layout="list" />
      <StyleHelp phone={settings.contact.phone} email={settings.contact.email} t={t} />
    </>
  );
}
