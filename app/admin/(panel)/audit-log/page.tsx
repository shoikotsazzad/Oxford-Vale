import { Suspense } from "react";
import { requireAdminPage } from "@/server/admin/guard";
import { AuditLogModel } from "@/models";
import { AdminPagination, dateTime, EmptyRow, Filter, FilterBar, filterInput, listHref, PageHeader, pageOf, Table, TableSkeleton, td, th } from "@/components/admin/ui";

export const metadata = { title: "Audit log" };
const PER_PAGE = 50;
const AREAS = ["order", "product", "category", "collection", "coupon", "zone", "settings", "user", "message", "media"];

export default function AuditLogPage(props: PageProps<"/admin/audit-log">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <AuditLog {...props} />
    </Suspense>
  );
}

const show = (v: unknown) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s === undefined || s === "null" || s === "" ? "—" : s.length > 80 ? `${s.slice(0, 77)}…` : s;
};

async function AuditLog({ searchParams }: PageProps<"/admin/audit-log">) {
  await requireAdminPage("audit");
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const params = { area: one("area"), actor: one("actor") };
  const filter: Record<string, unknown> = {};
  if (AREAS.includes(params.area ?? "")) filter["entity.type"] = params.area;
  if (/^[a-f0-9]{24}$/.test(params.actor ?? "")) filter.actor = params.actor;

  const [total, actors] = await Promise.all([AuditLogModel.countDocuments(filter), AuditLogModel.aggregate<{ _id: unknown; name: string }>([{ $group: { _id: "$actor", name: { $last: "$actorName" } } }])]);
  const { page, pages, skip } = pageOf(one("page"), total, PER_PAGE);
  const rows = await AuditLogModel.find(filter).sort({ at: -1 }).skip(skip).limit(PER_PAGE).lean();

  return (
    <>
      <PageHeader title="Audit log" text="Every change made in the admin panel, newest first." />
      <FilterBar action="/admin/audit-log">
        <Filter label="Area">
          <select name="area" defaultValue={params.area ?? ""} className={filterInput}>
            <option value="">All</option>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Filter>
        <Filter label="Who">
          <select name="actor" defaultValue={params.actor ?? ""} className={filterInput}>
            <option value="">Anyone</option>
            {actors.filter((a) => a._id).map((a) => <option key={String(a._id)} value={String(a._id)}>{a.name}</option>)}
          </select>
        </Filter>
      </FilterBar>
      <Table minWidth="56rem">
        <thead>
          <tr><th className={th}>When</th><th className={th}>Who</th><th className={th}>Action</th><th className={th}>Item</th><th className={th}>Changes</th></tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((r) => {
            const changes = Object.entries((r.changes ?? {}) as Record<string, { from: unknown; to: unknown }>);
            return (
              <tr key={String(r._id)}>
                <td className={`${td} whitespace-nowrap`}>{dateTime(r.at)}</td>
                <td className={td}>{r.actorName}<p className="text-xs text-muted">{r.actorRole} · {r.ip}</p></td>
                <td className={`${td} font-mono text-xs`}>{r.action}</td>
                <td className={td}>{r.entity?.label}</td>
                <td className={`${td} text-xs`}>
                  {changes.length ? (
                    <ul className="space-y-0.5">
                      {changes.slice(0, 6).map(([k, c]) => <li key={k}><span className="text-muted">{k}:</span> {show(c.from)} → {show(c.to)}</li>)}
                      {changes.length > 6 && <li className="text-muted">+{changes.length - 6} more</li>}
                    </ul>
                  ) : <span className="text-muted">—</span>}
                </td>
              </tr>
            );
          }) : <EmptyRow cols={5} text="Nothing logged yet." />}
        </tbody>
      </Table>
      <AdminPagination page={page} pages={pages} total={total} href={(n) => listHref("/admin/audit-log", params, { page: n })} />
    </>
  );
}
