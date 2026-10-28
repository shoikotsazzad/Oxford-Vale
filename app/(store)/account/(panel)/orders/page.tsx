import { requestDB } from "@/server/request-db";
import { getT } from "@/server/i18n";
import { getCurrentUser } from "@/server/auth/session";
import { getUserOrders } from "@/server/services/account";
import { buildMetadata } from "@/lib/seo";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { OrdersTable } from "@/components/account/OrdersTable";

export const metadata = buildMetadata({ title: "My orders", noindex: true });

export default async function OrdersPage() {
  await requestDB();
  const [t, user] = await Promise.all([getT(), getCurrentUser()]);
  if (!user) return null;
  const orders = await getUserOrders(user.id);
  return (
    <div>
      <h1 className="font-serif text-4xl md:text-5xl">{t.account.orders}</h1>
      <div className="mt-8">
        {orders.length ? <OrdersTable orders={orders} t={t} /> : <EmptyState title={t.account.noOrders} action={<ButtonLink href="/shop" arrow>{t.home.shopNow}</ButtonLink>} />}
      </div>
    </div>
  );
}
