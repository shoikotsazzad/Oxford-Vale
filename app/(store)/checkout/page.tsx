import { Suspense } from "react";
import { connection } from "next/server";
import { connectDB } from "@/server/db";
import { getT } from "@/server/i18n";
import { getCartToken } from "@/server/cart-cookie";
import { getCurrentUser } from "@/server/auth/session";
import { getSettings } from "@/server/services/settings";
import { getZones } from "@/server/services/delivery";
import { OrderError, priceCart, quote } from "@/server/services/order";
import { LeadModel, UserModel } from "@/models";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata = buildMetadata({ title: "Checkout", path: "/checkout", noindex: true });

export default function CheckoutPage() {
  return (
    <Container className="py-8 md:py-12">
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutContent />
      </Suspense>
    </Container>
  );
}

async function CheckoutContent() {
  await connection();
  await connectDB();
  const [t, settings, zones, user, token] = await Promise.all([getT(), getSettings(), getZones(), getCurrentUser(), getCartToken()]);

  let priced: Awaited<ReturnType<typeof priceCart>> | null = null;
  try {
    priced = await priceCart(token);
  } catch (err) {
    if (!(err instanceof OrderError)) throw err;
  }
  if (!priced || (!priced.lines.length && !priced.problems.length)) {
    return <EmptyState title={t.checkout.emptyTitle} text={t.cart.emptyText} action={<ButtonLink href="/shop" arrow>{t.home.shopNow}</ButtonLink>} />;
  }

  const rules = { zones, freeDeliveryThreshold: settings.freeDeliveryThreshold, payments: settings.payments };
  const [lead, account] = await Promise.all([
    priced.cart.lead ? LeadModel.findById(priced.cart.lead).select("name phone email").lean() : null,
    user ? UserModel.findById(user.id).select("addresses").lean() : null,
  ]);
  const savedAddresses = (account?.addresses ?? []).map((a) => ({
    id: String(a._id), label: a.label ?? "Home", isDefault: Boolean(a.isDefault), name: a.name, phone: a.phone,
    division: a.division, district: a.district, upazila: a.upazila, addressLine: a.addressLine,
  }));
  const first = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
  const { coupon: _c, ...initialQuote } = await quote(priced.lines, rules, { address: first ?? null });

  return (
    <>
      <Breadcrumbs items={[{ label: t.cart.title, href: "/cart" }, { label: t.checkout.title }]} />
      <h1 className="mt-4 font-serif text-4xl md:text-5xl">{t.checkout.title}</h1>
      <CheckoutForm
        lines={priced.lines.map((l) => ({ variantId: String(l.variant), name: l.name, image: l.image || null, size: l.size, colour: l.colour, qty: l.qty, lineTotal: l.lineTotal }))}
        initialQuote={{ ...initialQuote, problems: priced.problems }}
        contact={{ name: user?.name ?? lead?.name ?? "", phone: user?.phone || lead?.phone || "", email: user?.email ?? lead?.email ?? "" }}
        savedAddresses={savedAddresses}
        loggedIn={Boolean(user)}
        payments={{ cod: settings.payments.cod, sslcommerz: settings.payments.sslcommerz, bkash: settings.payments.bkash.enabled, nagad: settings.payments.nagad.enabled }}
      />
    </>
  );
}

function CheckoutSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-11 w-48" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_26rem]">
        <div className="space-y-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-56" />)}</div>
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
