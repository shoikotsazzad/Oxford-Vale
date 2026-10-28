import { Suspense } from "react";
import { connection } from "next/server";
import { connectDB } from "@/server/db";
import { getT } from "@/server/i18n";
import { getCartToken } from "@/server/cart-cookie";
import { buildCartView, findCart } from "@/server/services/cart";
import { getSettings } from "@/server/services/settings";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { CartPageClient } from "@/components/cart/CartPageClient";

export const metadata = buildMetadata({ title: "Your bag", path: "/cart", noindex: true });

export default function CartPage() {
  return (
    <Container className="py-8 md:py-12">
      <Suspense fallback={<CartSkeleton />}>
        <CartContent />
      </Suspense>
    </Container>
  );
}

async function CartContent() {
  await connection(); // cart count and cookies are per request
  await connectDB();
  const [t, settings, token] = await Promise.all([getT(), getSettings(), getCartToken()]);
  const view = await buildCartView(await findCart(token), settings.freeDeliveryThreshold);
  return (
    <>
      <h1 className="font-serif text-4xl md:text-5xl">{t.cart.title}</h1>
      <CartPageClient initial={view} />
    </>
  );
}

function CartSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-11 w-56" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-36" />)}</div>
        <Skeleton className="h-56" />
      </div>
    </div>
  );
}
