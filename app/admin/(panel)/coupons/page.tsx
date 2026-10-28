import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/server/admin/guard";
import { can } from "@/server/auth/rbac";
import { CouponModel } from "@/models";
import { formatBDT } from "@/lib/money";
import { CouponForm, type CouponValue } from "@/components/admin/CatalogForms";
import { Badge, Card, dateOnly, EmptyRow, PageHeader, ReadOnlyNote, Table, TableSkeleton, td, th } from "@/components/admin/ui";

export const metadata = { title: "Coupons" };
const local = (d?: Date | null) => (d ? new Date(d.getTime() + 6 * 3600_000).toISOString().slice(0, 16) : ""); // Dhaka datetime-local

export default function CouponsPage(props: PageProps<"/admin/coupons">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Coupons {...props} />
    </Suspense>
  );
}

async function Coupons({ searchParams }: PageProps<"/admin/coupons">) {
  const admin = await requireAdminPage("catalog.view");
  const editable = can(admin.role, "catalog.edit");
  const { edit } = await searchParams;
  const coupons = await CouponModel.find().sort({ isActive: -1, expiresAt: -1 }).lean();
  const now = new Date();

  let form: CouponValue | null = null;
  let usedCount = 0;
  if (editable && edit === "new") {
    form = { code: "", description: "", type: "percent", value: 10, maxDiscount: "", minOrder: 0, startsAt: "", expiresAt: local(new Date(now.getTime() + 30 * 864e5)), usageLimit: 0, perCustomerLimit: 1, isActive: true };
  } else if (editable && typeof edit === "string") {
    const c = coupons.find((x) => String(x._id) === edit);
    if (!c) notFound();
    usedCount = c.usedCount;
    form = {
      id: String(c._id), code: c.code, description: c.description ?? "", type: c.type, value: c.value, maxDiscount: c.maxDiscount ?? "", minOrder: c.minOrder,
      startsAt: local(c.startsAt), expiresAt: local(c.expiresAt), usageLimit: c.usageLimit, perCustomerLimit: c.perCustomerLimit, isActive: c.isActive,
    };
  }

  const state = (c: (typeof coupons)[number]) =>
    !c.isActive ? <Badge>Off</Badge>
    : c.expiresAt < now ? <Badge tone="bad">Expired</Badge>
    : c.startsAt && c.startsAt > now ? <Badge tone="info">Scheduled</Badge>
    : c.usageLimit && c.usedCount >= c.usageLimit ? <Badge tone="warn">Used up</Badge>
    : <Badge tone="ok">Live</Badge>;

  return (
    <>
      <PageHeader title="Coupons" text="One coupon per order. Totals are always checked again on the server." actions={editable && !form && <Link href="/admin/coupons?edit=new" className="label inline-flex h-10 items-center rounded-md bg-ink px-4 text-white hover:bg-charcoal">Add coupon</Link>} />
      {!editable && <ReadOnlyNote />}
      {form && (
        <Card title={form.id ? `Edit ${form.code}` : "New coupon"} className="mb-6">
          <CouponForm key={form.id ?? "new"} initial={form} usedCount={usedCount} />
        </Card>
      )}
      <Table minWidth="48rem">
        <thead>
          <tr><th className={th}>Code</th><th className={th}>Discount</th><th className={th}>Minimum</th><th className={th}>Used</th><th className={th}>Ends</th><th className={th}>State</th><th className={th} /></tr>
        </thead>
        <tbody>
          {coupons.length ? coupons.map((c) => (
            <tr key={String(c._id)}>
              <td className={td}><span className="font-mono font-medium">{c.code}</span>{c.description && <p className="text-xs text-muted">{c.description}</p>}</td>
              <td className={td}>{c.type === "percent" ? `${c.value}%${c.maxDiscount ? ` (max ${formatBDT(c.maxDiscount)})` : ""}` : formatBDT(c.value)}</td>
              <td className={td}>{c.minOrder ? formatBDT(c.minOrder) : "—"}</td>
              <td className={`${td} tabular-nums`}>{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
              <td className={td}>{dateOnly(c.expiresAt)}</td>
              <td className={td}>{state(c)}</td>
              <td className={`${td} text-right`}>{editable && <Link href={`/admin/coupons?edit=${c._id}`} className="underline">Edit</Link>}</td>
            </tr>
          )) : <EmptyRow cols={7} text="No coupons yet." />}
        </tbody>
      </Table>
    </>
  );
}
