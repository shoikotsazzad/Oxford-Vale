import { Suspense } from "react";
import { after } from "next/server";
import Link from "next/link";
import { requireAdminPage } from "@/server/admin/guard";
import { leadFilter, listCustomers, listLeads } from "@/server/services/admin-customers";
import { runAbandonedSweep } from "@/server/services/abandoned";
import { UserModel } from "@/models";
import { formatBDT } from "@/lib/money";
import { telLink } from "@/lib/contact";
import {
  AdminPagination, ago, Badge, dateTime, EmptyRow, Filter, FilterBar, filterInput, listHref, PageHeader, pageNum, Table, TableSkeleton, td, th, type Tone,
} from "@/components/admin/ui";

export const metadata = { title: "Customers & leads" };
const PER_PAGE = 25;
const LEAD_TONE: Record<string, Tone> = { cart: "info", abandoned: "warn", converted: "ok" };
const LEAD_LABEL: Record<string, string> = { cart: "In cart", abandoned: "Abandoned", converted: "Ordered" };

export default function CustomersPage(props: PageProps<"/admin/customers">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Customers {...props} />
    </Suspense>
  );
}

async function Customers({ searchParams }: PageProps<"/admin/customers">) {
  await requireAdminPage("customers");
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const tab = one("tab") === "leads" ? "leads" : "customers";
  const params = { tab: tab === "leads" ? "leads" : undefined, q: one("q"), status: one("status") };
  const tabCls = (active: boolean) => `label inline-flex h-10 items-center rounded-md px-4 ${active ? "bg-ink text-white" : "border border-line bg-white hover:border-ink"}`;
  const accounts = await UserModel.countDocuments({ role: "customer" });

  return (
    <>
      <PageHeader
        title="Customers & leads"
        text={`${accounts} registered account${accounts === 1 ? "" : "s"}. Customers are grouped by phone number, so guest orders are included.`}
        actions={
          <a href={listHref(tab === "leads" ? "/api/admin/leads/export" : "/api/admin/customers/export", { q: params.q, status: params.status })} className="label inline-flex h-10 items-center rounded-md border border-ink px-4 hover:bg-ink hover:text-white">
            Export CSV
          </a>
        }
      />
      <div className="mb-4 flex gap-2" role="tablist">
        <Link href="/admin/customers" className={tabCls(tab === "customers")} role="tab" aria-selected={tab === "customers"}>Customers</Link>
        <Link href="/admin/customers?tab=leads" className={tabCls(tab === "leads")} role="tab" aria-selected={tab === "leads"}>Cart leads</Link>
      </div>
      {tab === "customers" ? <CustomerTable params={params} page={one("page")} /> : <LeadTable params={params} page={one("page")} />}
    </>
  );
}

type Params = { tab?: string; q?: string; status?: string };

async function CustomerTable({ params, page: rawPage }: { params: Params; page?: string }) {
  const page = pageNum(rawPage);
  const { rows, total } = await listCustomers({ q: params.q, skip: (page - 1) * PER_PAGE, limit: PER_PAGE });
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  return (
    <>
      <FilterBar action="/admin/customers">
        <Filter label="Search">
          <input name="q" defaultValue={params.q} placeholder="Name, phone or email" className={`${filterInput} w-64`} />
        </Filter>
      </FilterBar>
      <Table>
        <thead>
          <tr>
            <th className={th}>Customer</th>
            <th className={th}>Phone</th>
            <th className={`${th} text-right`}>Orders</th>
            <th className={`${th} text-right`}>Spent</th>
            <th className={th}>Last order</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((c) => (
              <tr key={c.phone}>
                <td className={td}>
                  {c.name} {c.hasAccount && <Badge tone="info">Account</Badge>}
                  {c.email && <p className="text-xs text-muted">{c.email}</p>}
                </td>
                <td className={td}><a href={telLink(c.phone)} className="hover:underline">{c.phone}</a></td>
                <td className={`${td} text-right tabular-nums`}><Link href={`/admin/orders?q=${c.phone}`} className="underline">{c.orders}</Link></td>
                <td className={`${td} text-right tabular-nums`}>{formatBDT(c.spent)}</td>
                <td className={td}>{dateTime(c.lastOrderAt)}</td>
              </tr>
            ))
          ) : (
            <EmptyRow cols={5} text="No customers yet." />
          )}
        </tbody>
      </Table>
      <AdminPagination page={page} pages={pages} total={total} href={(n) => listHref("/admin/customers", params, { page: n })} />
    </>
  );
}

async function LeadTable({ params, page: rawPage }: { params: Params; page?: string }) {
  const sweep = await runAbandonedSweep({ defer: after });
  const filter = leadFilter(params);
  const page = pageNum(rawPage);
  const { rows, total } = await listLeads(filter, { skip: (page - 1) * PER_PAGE, limit: PER_PAGE });
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  return (
    <>
      <FilterBar action="/admin/customers">
        <input type="hidden" name="tab" value="leads" />
        <Filter label="Search">
          <input name="q" defaultValue={params.q} placeholder="Name, phone or email" className={`${filterInput} w-64`} />
        </Filter>
        <Filter label="Status">
          <select name="status" defaultValue={params.status ?? ""} className={filterInput}>
            <option value="">All</option>
            <option value="cart">In cart</option>
            <option value="abandoned">Abandoned</option>
            <option value="converted">Ordered</option>
          </select>
        </Filter>
      </FilterBar>
      <p className="mb-3 text-xs text-muted">Carts idle for over {sweep.minutes} minutes are marked abandoned.</p>
      <Table minWidth="54rem">
        <thead>
          <tr>
            <th className={th}>Lead</th>
            <th className={th}>Cart</th>
            <th className={`${th} text-right`}>Value</th>
            <th className={th}>Status</th>
            <th className={th}>Last active</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((l) => (
              <tr key={String(l._id)}>
                <td className={td}>
                  {l.name}
                  <p className="text-xs text-muted"><a href={telLink(l.phone)} className="hover:underline">{l.phone}</a>{l.email && ` · ${l.email}`}</p>
                  <p className="text-xs text-muted">{l.source === "checkout" ? "From checkout" : "From add to cart"}</p>
                </td>
                <td className={td}>
                  {l.cartSnapshot.length ? (
                    <details>
                      <summary className="cursor-pointer">{l.cartSnapshot.reduce((n, i) => n + (i.qty ?? 0), 0)} item(s)</summary>
                      <ul className="mt-2 space-y-1 text-xs text-muted">
                        {l.cartSnapshot.map((i, k) => <li key={k}>{i.qty} × {i.name} ({i.size}) · {formatBDT(i.unitPrice ?? 0)}</li>)}
                      </ul>
                    </details>
                  ) : (
                    <span className="text-muted">Empty</span>
                  )}
                </td>
                <td className={`${td} text-right tabular-nums`}>{formatBDT(l.cartValue)}</td>
                <td className={td}>
                  <Badge tone={LEAD_TONE[l.status]}>{LEAD_LABEL[l.status]}</Badge>
                  {l.order && <p className="mt-1 text-xs"><Link href={`/admin/orders/${l.order.orderNo}`} className="underline">{l.order.orderNo}</Link></p>}
                </td>
                <td className={td}>{ago(l.lastActivityAt)}<p className="text-xs text-muted">{dateTime(l.lastActivityAt)}</p></td>
              </tr>
            ))
          ) : (
            <EmptyRow cols={5} text="No leads match these filters." />
          )}
        </tbody>
      </Table>
      <AdminPagination page={page} pages={pages} total={total} href={(n) => listHref("/admin/customers", params, { page: n })} />
    </>
  );
}
