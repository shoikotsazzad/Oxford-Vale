import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requestDB } from "@/server/request-db";
import { getT } from "@/server/i18n";
import { getCurrentUser } from "@/server/auth/session";
import { getSettings } from "@/server/services/settings";
import { getOrderView } from "@/server/services/order-view";
import { orderKey, verifyOrderKey } from "@/server/crypto";
import { buildMetadata } from "@/lib/seo";
import { formatMoney } from "@/lib/money";
import { Container } from "@/components/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { RetryPayment } from "@/components/order/PayForms";

export const metadata = buildMetadata({ title: "Complete payment", noindex: true });

export default function PayPage(props: PageProps<"/checkout/pay/[orderNo]">) {
  return (
    <Suspense fallback={<Container className="max-w-xl py-16"><Skeleton className="h-96" /></Container>}>
      <PayContent {...props} />
    </Suspense>
  );
}

async function PayContent({ params, searchParams }: PageProps<"/checkout/pay/[orderNo]">) {
  const [{ orderNo }, sp, t] = await Promise.all([params, searchParams, getT()]);
  const givenKey = typeof sp.key === "string" ? sp.key : undefined;
  await requestDB();
  const [order, user, settings] = await Promise.all([getOrderView(orderNo), getCurrentUser(), getSettings()]);
  const allowed = order && (verifyOrderKey(orderNo, givenKey) || (user && order.userId === user.id));
  if (!order || !allowed) redirect("/track-order");
  const key = orderKey(orderNo);
  if (order.paymentStatus === "paid" || order.status !== "pending") {
    redirect(`/order/${orderNo}?key=${key}`);
  }

  const status = typeof sp.status === "string" ? sp.status : null;
  // The method chosen at checkout first, then the other one.
  const methods = (["stripe", "paypal"] as const)
    .filter((m) => settings.payments[m])
    .sort((a, b) => Number(b === order.paymentMethod) - Number(a === order.paymentMethod))
    .map((id) => ({ id, label: id === "stripe" ? t.pay.withStripe : t.pay.withPaypal }));

  return (
    <Container className="max-w-xl py-10 md:py-16">
      <p className="label text-muted">{t.order.title} {order.orderNo}</p>
      <h1 className="mt-2 font-serif text-4xl">{t.pay.title}</h1>
      <p className="mt-6 flex items-baseline justify-between rounded-lg bg-ink px-5 py-4 text-paper">
        <span className="label text-paper/70">{t.checkout.total}</span>
        <span className="text-2xl">{formatMoney(order.total)}</span>
      </p>

      <div className="mt-8 space-y-6">
        <p className={`rounded-md px-4 py-3 text-sm ${status ? "bg-danger/10 text-danger" : "bg-sand text-ink"}`} role={status ? "alert" : undefined}>
          {status === "cancelled" ? t.pay.cancelledMsg : status === "unavailable" ? t.pay.unavailable : status ? t.pay.failed : t.pay.pending}
        </p>
        <RetryPayment orderNo={order.orderNo} orderKey={key} methods={methods} />
      </div>
      <div className="mt-10 border-t border-line pt-6">
        <ButtonLink href={`/order/${order.orderNo}?key=${key}`} variant="secondary">{t.order.title} {order.orderNo}</ButtonLink>
      </div>
    </Container>
  );
}
