import { Suspense } from "react";
import { connection } from "next/server";
import { getSettings } from "@/server/services/settings";
import { getCategories } from "@/server/services/catalog";
import { getDictionary } from "@/lib/i18n";
import { I18nProvider } from "@/components/I18nProvider";
import { AnnouncementBar } from "@/components/store/AnnouncementBar";
import { Header, HeaderSkeleton } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { MobileTabBar } from "@/components/store/MobileTabBar";
import { StoreJsonLd } from "@/components/store/StoreJsonLd";
import { CartProvider } from "@/components/cart/CartProvider";
import { connectDB } from "@/server/db";
import { getCartToken } from "@/server/cart-cookie";
import { cartCount } from "@/server/services/cart";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<HeaderSkeleton />}>
      <StoreShell>{children}</StoreShell>
    </Suspense>
  );
}

/** Reads store settings and cart count once, then renders the storefront chrome. */
async function StoreShell({ children }: { children: React.ReactNode }) {
  await connection(); // cart count and cookies are per request
  await connectDB();
  const [settings, categories, count] = await Promise.all([
    getSettings(),
    getCategories(),
    getCartToken().then(cartCount),
  ]);
  const t = getDictionary();
  return (
    <I18nProvider t={t}>
      <CartProvider initialCount={count}>
        <div className="flex min-h-full flex-1 flex-col">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
          >
            Skip to content
          </a>
          <AnnouncementBar bar={settings.announcementBar} />
          <Header settings={settings} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer settings={settings} categories={categories} t={t} />
          <MobileTabBar />
          <StoreJsonLd settings={settings} />
        </div>
      </CartProvider>
    </I18nProvider>
  );
}
