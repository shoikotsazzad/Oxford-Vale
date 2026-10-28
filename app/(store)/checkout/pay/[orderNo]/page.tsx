import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requestDB } from "@/server/request-db";
import { getT } from "@/server/i18n";
import { getCurrentUser } from "@/server/auth/session";
import { getSettings } from "@/server/services/settings";
import { getOrderView } from "@/server/services/order-view";
import { orderKey, verifyOrderKey } from "@/server/crypto";
import { buildMetadata } from "@/lib/seo";
import { fmt } from "@/lib/i18n";
import { formatBDT } from "@/lib/money";
import { Container } from "@/components/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ManualPaymentForm, RetryPayment } from "@/components/order/PayForms";

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
  if (order.paymentStatus === "paid" || order.status !== "pending" || order.awaitingVerification || order.paymentMethod === "cod") {
    redirect(`/order/${orderNo}?key=${key}`);
  }

  const status = typeof sp.status === "string" ? sp.status : null;
  const manual = order.paymentMethod === "bkash" || order.paymentMethod === "nagad";
  const methodName = t.order.methods[order.paymentMethod];
  const number = order.paymentMethod === "bkash" ? settings.payments.bkash.number : settings.payments.nagad.number;

  return (
    <Container className="max-w-xl py-10 md:py-16">
      <p className="label text-muted">{t.order.title} {order.orderNo}</p>
      <h1 className="mt-2 font-serif text-4xl">{t.pay.title}</h1>
      <p className="mt-6 flex items-baseline justify-between rounded-lg bg-ink px-5 py-4 text-white">
        <span className="label text-white/70">{t.checkout.total}</span>
        <span className="text-2xl">{formatBDT(order.total)}</span>
      </p>

      {manual ? (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="font-serif text-2xl">{t.pay.manualSteps}</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ink/85">
              <li>{fmt(t.pay.step1, { method: methodName })}</li>
              <li>{fmt(t.pay.step2, { amount: formatBDT(order.total), number })}</li>
              <li>{fmt(t.pay.step3, { orderNo: order.orderNo })}</li>
              <li>{t.pay.step4}</li>
            </ol>
          </section>
          <ManualPaymentForm orderNo={order.orderNo} orderKey={key} />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {status && (
            <p className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
              {status === "cancelled" ? t.pay.cancelledMsg : status === "unavailable" ? t.pay.unavailable : t.pay.failed}
            </p>
          )}
          <RetryPayment orderNo={order.orderNo} orderKey={key} codEnabled={settings.payments.cod} />
        </div>
      )}
      <div className="mt-10 border-t border-line pt-6">
        <ButtonLink href={`/order/${order.orderNo}?key=${key}`} variant="secondary">{t.order.title} {order.orderNo}</ButtonLink>
      </div>
    </Container>
  );
}
