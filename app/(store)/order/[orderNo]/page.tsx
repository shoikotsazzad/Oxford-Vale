import { Suspense } from "react";
import { requestDB } from "@/server/request-db";
import { getT } from "@/server/i18n";
import { getCurrentUser } from "@/server/auth/session";
import { getSettings } from "@/server/services/settings";
import { getOrderView } from "@/server/services/order-view";
import { verifyOrderKey } from "@/server/crypto";
import { buildMetadata } from "@/lib/seo";
import { whatsappLink } from "@/lib/contact";
import { Container } from "@/components/Container";
import { ButtonLink } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { ProductSkeleton } from "@/components/ui/Skeleton";
import { OrderDetails } from "@/components/order/OrderDetails";
import { OrderActions } from "@/components/order/OrderActions";

export const metadata = buildMetadata({ title: "Your order", noindex: true });

export default function OrderPage(props: PageProps<"/order/[orderNo]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <OrderContent {...props} />
    </Suspense>
  );
}

async function OrderContent({ params, searchParams }: PageProps<"/order/[orderNo]">) {
  const [{ orderNo }, sp, t] = await Promise.all([params, searchParams, getT()]);
  const key = typeof sp.key === "string" ? sp.key : undefined;
  await requestDB();
  const [order, user, settings] = await Promise.all([getOrderView(orderNo), getCurrentUser(), getSettings()]);
  const allowed = order && (verifyOrderKey(orderNo, key) || (user && order.userId === user.id));

  if (!order || !allowed) {
    return (
      <Container className="max-w-xl py-20 text-center">
        <h1 className="font-serif text-4xl">{t.order.title} {orderNo}</h1>
        <p className="mt-4 text-muted">{t.order.noAccess}</p>
        <ButtonLink href="/track-order" className="mt-8" arrow>{t.order.track}</ButtonLink>
      </Container>
    );
  }

  const banner = sp.paid ? { title: t.order.paidTitle, text: t.order.paidText } : sp.submitted ? { title: t.order.submittedTitle, text: t.order.submittedText } : sp.placed ? { title: t.order.thanks, text: t.order.thanksText } : null;
  const needsPayment = order.status === "pending" && order.paymentStatus !== "paid" && order.paymentMethod !== "cod" && !order.awaitingVerification;
  const keyParam = key ? `?key=${key}` : "";

  return (
    <Container className="py-8 md:py-12">
      {banner && (
        <div className="mb-8 flex gap-4 rounded-lg bg-ink p-5 text-white md:p-6" role="status">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10"><CheckIcon /></span>
          <div><p className="font-serif text-2xl">{banner.title}</p><p className="mt-1 text-sm text-white/75">{banner.text}</p></div>
        </div>
      )}
      <p className="label text-muted">{t.order.placedOn} {new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "Asia/Dhaka" }).format(new Date(order.createdAt))}</p>
      <h1 className="mt-2 font-serif text-4xl md:text-5xl">{t.order.title} {order.orderNo}</h1>
      <div className="mt-8">
        <OrderDetails
          order={order}
          t={t}
          actions={
            <OrderActions
              orderNo={order.orderNo}
              orderKey={key}
              canCancel={order.status === "pending"}
              payHref={needsPayment ? `/checkout/pay/${order.orderNo}${keyParam}` : undefined}
              whatsappHref={whatsappLink(settings.contact.whatsapp, `Hello ${settings.storeName}, I have a question about my order ${order.orderNo}.`)}
            />
          }
        />
      </div>
    </Container>
  );
}
