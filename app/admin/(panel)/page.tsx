import { Suspense } from "react";
import { after } from "next/server";
import Link from "next/link";
import { requireAdminPage } from "@/server/admin/guard";
import { getDashboard } from "@/server/services/admin-dashboard";
import { runAbandonedSweep } from "@/server/services/abandoned";
import { getSettings } from "@/server/services/settings";
import { formatMoney } from "@/lib/money";
import { SalesChart } from "@/components/admin/SalesChart";
import { ago, Badge, Card, dateTime, OrderStatusBadge, PageHeader, PaymentBadge, StatCard, TableSkeleton } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

export default function DashboardPage(props: PageProps<"/admin">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Dashboard {...props} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const admin = await requireAdminPage("dashboard");
  const { denied } = await searchParams;
  // Vercel Hobby only runs the cron daily, so opening the dashboard also marks idle carts as abandoned.
  const [sweep, settings] = await Promise.all([runAbandonedSweep({ defer: after }), getSettings()]);
  const d = await getDashboard(settings.lowStockThreshold);
  const a = d.attention;

  return (
    <>
      <PageHeader title={`Hello, ${admin.name.split(" ")[0]}`} text="Sales are counted by order date (UK time) and exclude cancelled, returned and refunded orders." />
      {denied && <p role="alert" className="mb-6 rounded-md bg-warn/10 px-4 py-3 text-sm text-warn">Your role doesn&apos;t have access to that page.</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today" value={formatMoney(d.today.revenue)} hint={`${d.today.orders} order${d.today.orders === 1 ? "" : "s"}`} />
        <StatCard label="Last 7 days" value={formatMoney(d.week.revenue)} hint={`${d.week.orders} orders`} />
        <StatCard label="Last 30 days" value={formatMoney(d.month.revenue)} hint={`${d.month.orders} orders`} />
        <StatCard label="Average order (30 d)" value={formatMoney(d.month.aov)} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending orders" value={String(a.pending)} hint="Confirm or cancel" href="/admin/orders?status=pending" />
        <StatCard label="Awaiting payment" value={String(a.awaitingPayment)} hint="Checkout started, not paid" href="/admin/orders?payment=awaiting" />
        <StatCard label="To ship" value={String(a.toShip)} hint="Confirmed + processing" href="/admin/orders?status=confirmed,processing" />
        <StatCard label="New messages" value={String(a.newMessages)} href="/admin/messages" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card title="Sales, last 30 days">
          <SalesChart data={d.chart} />
        </Card>
        <Card title="Top products (30 d)" pad={false}>
          {d.topProducts.length ? (
            <ol className="divide-y divide-line text-sm">
              {d.topProducts.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-5 text-muted tabular-nums">{i + 1}</span>
                  <Link href={`/admin/products/${p.id}`} className="min-w-0 flex-1 truncate hover:underline">{p.name}</Link>
                  <span className="text-muted tabular-nums">{p.qty} sold</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="px-5 py-8 text-sm text-muted">No sales yet.</p>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Recent orders" actions={<Link href="/admin/orders" className="text-sm underline">All orders</Link>} pad={false}>
          {d.recentOrders.length ? (
            <ul className="divide-y divide-line text-sm">
              {d.recentOrders.map((o) => (
                <li key={o.orderNo} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
                  <Link href={`/admin/orders/${o.orderNo}`} className="font-medium hover:underline">{o.orderNo}</Link>
                  <span className="min-w-0 flex-1 truncate text-muted">{o.name}</span>
                  <span className="tabular-nums">{formatMoney(o.total)}</span>
                  <OrderStatusBadge status={o.status} />
                  <PaymentBadge status={o.paymentStatus} />
                  <span className="w-full text-xs text-muted">{dateTime(o.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-sm text-muted">No orders yet.</p>
          )}
        </Card>

        <div className="min-w-0 space-y-6">
          <Card title={`Low stock (≤ ${settings.lowStockThreshold})`} pad={false}>
            {d.lowStock.length ? (
              <ul className="divide-y divide-line text-sm">
                {d.lowStock.map((v) => (
                  <li key={v.sku} className="flex items-center gap-3 px-5 py-3">
                    <Link href={`/admin/products/${v.productId}`} className="min-w-0 flex-1 truncate hover:underline">
                      {v.name} <span className="text-muted">· {v.size}{v.colour ? ` · ${v.colour}` : ""}</span>
                    </Link>
                    <Badge tone={v.stock === 0 ? "bad" : "warn"}>{v.stock === 0 ? "Sold out" : `${v.stock} left`}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-sm text-muted">Everything is well stocked.</p>
            )}
          </Card>

          <Card title="Open leads" actions={<Link href="/admin/customers?tab=leads" className="text-sm underline">All leads</Link>} pad={false}>
            {d.leads.length ? (
              <ul className="divide-y divide-line text-sm">
                {d.leads.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
                    <span className="font-medium">{l.name}</span>
                    <a href={`tel:${l.phone}`} className="text-muted hover:underline">{l.phone}</a>
                    <span className="ml-auto tabular-nums">{formatMoney(l.cartValue)}</span>
                    <Badge tone={l.status === "abandoned" ? "warn" : "info"}>{l.status === "abandoned" ? "Abandoned" : "In cart"}</Badge>
                    <span className="w-full text-xs text-muted">Active {ago(l.lastActivityAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-sm text-muted">No open carts with contact details.</p>
            )}
            {sweep.abandoned > 0 && <p className="border-t border-line px-5 py-3 text-xs text-muted">{sweep.abandoned} cart{sweep.abandoned === 1 ? "" : "s"} just marked abandoned (idle over {sweep.minutes} min).</p>}
          </Card>
        </div>
      </div>
    </>
  );
}
