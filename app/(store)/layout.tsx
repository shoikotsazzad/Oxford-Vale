import { Suspense } from "react";
import { connection } from "next/server";
import { getLang } from "@/server/i18n";
import { getSettings } from "@/server/services/settings";
import { getCategories } from "@/server/services/catalog";
import { getDictionary } from "@/lib/i18n";
import { I18nProvider } from "@/components/I18nProvider";
import { AnnouncementBar } from "@/components/store/AnnouncementBar";
import { Header, HeaderSkeleton } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { WhatsAppButton } from "@/components/store/WhatsAppButton";
import { StoreJsonLd } from "@/components/store/StoreJsonLd";
import { CartProvider } from "@/components/cart/CartProvider";
import { WishlistProvider } from "@/components/store/WishlistProvider";
import { getCurrentUser } from "@/server/auth/session";
import { UserModel } from "@/models";
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

/** Reads the language cookie and store settings once, then renders the storefront chrome. */
async function StoreShell({ children }: { children: React.ReactNode }) {
  await connection(); // cart count and cookies are per request
  await connectDB();
  const [lang, settings, categories, count, user] = await Promise.all([
    getLang(),
    getSettings(),
    getCategories(),
    getCartToken().then(cartCount),
    getCurrentUser(),
  ]);
  const wishlist = user
    ? (
        (await UserModel.findById(user.id).select("wishlist").lean())
          ?.wishlist ?? []
      ).map(String)
    : [];
  const t = getDictionary(lang);
  return (
    <I18nProvider lang={lang} t={t}>
      <CartProvider initialCount={count}>
        <WishlistProvider initialIds={wishlist} loggedIn={Boolean(user)}>
          <div
            lang={lang}
            className={`flex min-h-full flex-1 flex-col ${lang === "bn" ? "lang-bn" : ""}`}
          >
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
            >
              Skip to content
            </a>
            <AnnouncementBar bar={settings.announcementBar} />
            <Header settings={settings} />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer settings={settings} categories={categories} t={t} />
            <WhatsAppButton
              number={settings.contact.whatsapp}
              message={`Hello ${settings.storeName}, I have a question about a product.`}
            />
            <StoreJsonLd settings={settings} />
          </div>
        </WishlistProvider>
      </CartProvider>
    </I18nProvider>
  );
}
