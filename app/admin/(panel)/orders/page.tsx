import { Suspense } from "react";
import Link from "next/link";
import { requireAdminPage } from "@/server/admin/guard";
import { orderFilter, pickOrderParams } from "@/server/services/admin-orders";
import { OrderModel, ORDER_STATUSES } from "@/models";
import { formatMoney } from "@/lib/money";
import {
  AdminPagination, dateTime, EmptyRow, Filter, FilterBar, filterInput, label, listHref, OrderStatusBadge, PageHeader, pageOf, PaymentBadge, Table, TableSkeleton, td, th,
} from "@/components/admin/ui";

export const metadata = { title: "Orders" };
const PER_PAGE = 25;
const METHOD: Record<string, string> = { stripe: "Stripe", paypal: "PayPal" };

export default function OrdersPage(props: PageProps<"/admin/orders">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Orders {...props} />
    </Suspense>
  );
}

async function Orders({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdminPage("orders");
  const sp = await searchParams;
  const params = pickOrderParams(sp);
  const filter = orderFilter(params);
  const total = await OrderModel.countDocuments(filter);
  const { page, pages, skip } = pageOf(typeof sp.page === "string" ? sp.page : undefined, total, PER_PAGE);
  const orders = await OrderModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(PER_PAGE)
    .select("orderNo customer total status paymentStatus paymentMethod payment.submittedAt items.qty createdAt delivery.name")
    .lean();
  const exportHref = listHref("/api/admin/orders/export", { ...params });

  return (
    <>
      <PageHeader title="Orders" actions={<a href={exportHref} className="label inline-flex h-10 items-center rounded-md border border-ink px-4 hover:bg-ink hover:text-paper">Export CSV</a>} />
      <FilterBar action="/admin/orders">
        <Filter label="Search">
          <input name="q" defaultValue={params.q} placeholder="Order no, name, phone, Trx ID" className={`${filterInput} w-64`} />
        </Filter>
        <Filter label="Status">
          <select name="status" defaultValue={params.status ?? ""} className={filterInput}>
            <option value="">All</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            <option value="confirmed,processing">To ship</option>
          </select>
        </Filter>
        <Filter label="Payment">
          <select name="payment" defaultValue={params.payment ?? ""} className={filterInput}>
            <option value="">All</option>
            <option value="awaiting">Awaiting payment</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </Filter>
        <Filter label="Method">
          <select name="method" defaultValue={params.method ?? ""} className={filterInput}>
            <option value="">All</option>
            {Object.entries(METHOD).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Filter>
        <Filter label="From">
          <input type="date" name="from" defaultValue={params.from} className={filterInput} />
        </Filter>
        <Filter label="To">
          <input type="date" name="to" defaultValue={params.to} className={filterInput} />
        </Filter>
      </FilterBar>

      <Table minWidth="56rem">
        <thead>
          <tr>
            <th className={th}>Order</th>
            <th className={th}>Customer</th>
            <th className={th}>Items</th>
            <th className={`${th} text-right`}>Total</th>
            <th className={th}>Payment</th>
            <th className={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.length ? (
            orders.map((o) => (
              <tr key={o.orderNo} className="hover:bg-paper/50">
                <td className={td}>
                  <Link href={`/admin/orders/${o.orderNo}`} className="font-medium underline-offset-2 hover:underline">{o.orderNo}</Link>
                  <p className="text-xs text-muted">{dateTime(o.createdAt)}</p>
                </td>
                <td className={td}>
                  {o.customer?.name}
                  <p className="text-xs text-muted">{o.customer?.phone} · {o.delivery?.name}</p>
                </td>
                <td className={`${td} tabular-nums`}>{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                <td className={`${td} text-right tabular-nums`}>{formatMoney(o.total)}</td>
                <td className={td}>
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-xs text-muted">{METHOD[o.paymentMethod]}</span>
                    <PaymentBadge status={o.paymentStatus} />
                  </div>
                </td>
                <td className={td}><OrderStatusBadge status={o.status} /></td>
              </tr>
            ))
          ) : (
            <EmptyRow cols={6} text="No orders match these filters." />
          )}
        </tbody>
      </Table>
      <AdminPagination page={page} pages={pages} total={total} href={(n) => listHref("/admin/orders", { ...params }, { page: n })} />
    </>
  );
}
