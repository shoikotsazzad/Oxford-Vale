import { requestDB } from "@/server/request-db";
import { getT } from "@/server/i18n";
import { getCurrentUser } from "@/server/auth/session";
import { getUserOrders, getUserProfile } from "@/server/services/account";
import { buildMetadata } from "@/lib/seo";
import { fmt } from "@/lib/i18n";
import { ButtonLink } from "@/components/ui/Button";
import { ProfileForm } from "@/components/account/ProfileForm";
import { OrdersTable } from "@/components/account/OrdersTable";

export const metadata = buildMetadata({ title: "My account", noindex: true });

export default async function AccountPage() {
  await requestDB();
  const [t, user] = await Promise.all([getT(), getCurrentUser()]);
  if (!user) return null;
  const [profile, orders] = await Promise.all([getUserProfile(user.id), getUserOrders(user.id, 3)]);
  return (
    <div className="space-y-12">
      <h1 className="font-serif text-4xl md:text-5xl">{fmt(t.account.hello, { name: user.name.split(" ")[0] })}</h1>
      <section>
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-2xl">{t.account.recentOrders}</h2>
          {orders.length > 0 && <ButtonLink href="/account/orders" variant="secondary" className="!min-h-9">{t.account.viewAll}</ButtonLink>}
        </div>
        <div className="mt-4">{orders.length ? <OrdersTable orders={orders} t={t} /> : <p className="text-muted">{t.account.noOrders}</p>}</div>
      </section>
      <section>
        <h2 className="font-serif text-2xl">{t.account.profile}</h2>
        <div className="mt-4 max-w-xl"><ProfileForm name={profile?.name ?? ""} phone={profile?.phone ?? ""} email={profile?.email ?? ""} /></div>
      </section>
    </div>
  );
}
