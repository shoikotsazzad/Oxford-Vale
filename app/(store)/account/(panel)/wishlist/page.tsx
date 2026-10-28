import { requestDB } from "@/server/request-db";
import { getT } from "@/server/i18n";
import { getCurrentUser } from "@/server/auth/session";
import { getUserProfile } from "@/server/services/account";
import { getProductCardsByIds } from "@/server/services/catalog";
import { buildMetadata } from "@/lib/seo";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { ProductCard } from "@/components/store/ProductCard";

export const metadata = buildMetadata({ title: "Wishlist", noindex: true });

export default async function WishlistPage() {
  await requestDB();
  const [t, user] = await Promise.all([getT(), getCurrentUser()]);
  if (!user) return null;
  const profile = await getUserProfile(user.id);
  const products = await getProductCardsByIds([...(profile?.wishlist ?? [])].reverse());
  return (
    <div>
      <h1 className="font-serif text-4xl md:text-5xl">{t.account.wishlist}</h1>
      <div className="mt-8">
        {products.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} product={p} t={t} />)}
          </div>
        ) : (
          <EmptyState title={t.account.emptyWishlist} text={t.account.emptyWishlistText} action={<ButtonLink href="/shop" arrow>{t.home.shopNow}</ButtonLink>} />
        )}
      </div>
    </div>
  );
}
