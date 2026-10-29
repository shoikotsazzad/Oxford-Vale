import { notFound } from "next/navigation";
import { requestDB } from "@/server/request-db";
import { getT } from "@/server/i18n";
import { getCurrentUser } from "@/server/auth/session";
import { getSettings } from "@/server/services/settings";
import { getOrderView } from "@/server/services/order-view";
import { orderKey } from "@/server/crypto";
import { buildMetadata } from "@/lib/seo";
import { mailtoLink } from "@/lib/contact";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { OrderDetails } from "@/components/order/OrderDetails";
import { OrderActions } from "@/components/order/OrderActions";

export const metadata = buildMetadata({ title: "Order details", noindex: true });

export default async function AccountOrderPage({ params }: PageProps<"/account/orders/[orderNo]">) {
  const [{ orderNo }, t] = await Promise.all([params, getT()]);
  await requestDB();
  const [user, order, settings] = await Promise.all([getCurrentUser(), getOrderView(orderNo), getSettings()]);
  if (!user || !order || order.userId !== user.id) notFound();
  const needsPayment = order.status === "pending" && order.paymentStatus !== "paid";
  return (
    <div>
      <Breadcrumbs items={[{ label: t.account.orders, href: "/account/orders" }, { label: order.orderNo }]} />
      <h1 className="mt-4 font-serif text-4xl">{t.order.title} {order.orderNo}</h1>
      <div className="mt-8">
        <OrderDetails order={order} t={t} actions={
          <OrderActions orderNo={order.orderNo} canCancel={order.status === "pending"}
            payHref={needsPayment ? `/checkout/pay/${order.orderNo}?key=${orderKey(order.orderNo)}` : undefined}
            contactHref={mailtoLink(settings.contact.supportEmail || settings.contact.email, `Order ${order.orderNo}`)} />
        } />
      </div>
    </div>
  );
}
