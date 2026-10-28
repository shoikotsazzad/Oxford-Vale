import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/server/admin/guard";
import { can } from "@/server/auth/rbac";
import { getSettings } from "@/server/services/settings";
import { DeliveryZoneModel } from "@/models";
import { formatBDT } from "@/lib/money";
import { ZoneForm, type ZoneValue } from "@/components/admin/CatalogForms";
import { Badge, Card, EmptyRow, PageHeader, ReadOnlyNote, Table, TableSkeleton, td, th } from "@/components/admin/ui";

export const metadata = { title: "Delivery zones" };

export default function ZonesPage(props: PageProps<"/admin/delivery-zones">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Zones {...props} />
    </Suspense>
  );
}

const rules = (m: { divisions: string[]; districts: string[]; areas: string[] }) => {
  const parts = [m.areas.length && `${m.areas.length} area${m.areas.length === 1 ? "" : "s"}`, m.districts.length && m.districts.join(", "), m.divisions.length && `${m.divisions.join(", ")} division`].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Everywhere else (fallback)";
};

async function Zones({ searchParams }: PageProps<"/admin/delivery-zones">) {
  const admin = await requireAdminPage("catalog.view");
  const editable = can(admin.role, "catalog.edit");
  const { edit } = await searchParams;
  const [zones, settings] = await Promise.all([DeliveryZoneModel.find().sort({ sortOrder: 1 }).lean(), getSettings()]);

  let form: ZoneValue | null = null;
  if (editable && edit === "new") form = { name: "", fee: 120, etaMinDays: 2, etaMaxDays: 4, divisions: [], districts: [], areas: [], sortOrder: (zones.at(-1)?.sortOrder ?? 0) + 1, isActive: true };
  else if (editable && typeof edit === "string") {
    const z = zones.find((x) => String(x._id) === edit);
    if (!z) notFound();
    form = { id: String(z._id), name: z.name, fee: z.fee, etaMinDays: z.etaMinDays, etaMaxDays: z.etaMaxDays, divisions: z.match?.divisions ?? [], districts: z.match?.districts ?? [], areas: z.match?.areas ?? [], sortOrder: z.sortOrder, isActive: z.isActive };
  }

  return (
    <>
      <PageHeader
        title="Delivery zones"
        text={`Free delivery on orders over ${formatBDT(settings.freeDeliveryThreshold)} (after discounts). Change the threshold in Settings.`}
        actions={editable && !form && <Link href="/admin/delivery-zones?edit=new" className="label inline-flex h-10 items-center rounded-md bg-ink px-4 text-white hover:bg-charcoal">Add zone</Link>}
      />
      {!editable && <ReadOnlyNote />}
      {form && (
        <Card title={form.id ? `Edit ${form.name}` : "New zone"} className="mb-6">
          <ZoneForm key={form.id ?? "new"} initial={form} />
        </Card>
      )}
      <Table minWidth="44rem">
        <thead>
          <tr><th className={th}>Zone</th><th className={th}>Covers</th><th className={`${th} text-right`}>Fee</th><th className={th}>Delivery time</th><th className={th} /></tr>
        </thead>
        <tbody>
          {zones.length ? zones.map((z) => {
            const m = { divisions: z.match?.divisions ?? [], districts: z.match?.districts ?? [], areas: z.match?.areas ?? [] };
            return (
              <tr key={String(z._id)}>
                <td className={td}><span className="font-medium">{z.name}</span> {!z.isActive && <Badge>Off</Badge>}</td>
                <td className={`${td} max-w-xs text-muted`}>{rules(m)}</td>
                <td className={`${td} text-right tabular-nums`}>{formatBDT(z.fee)}</td>
                <td className={td}>{z.etaMinDays}–{z.etaMaxDays} days</td>
                <td className={`${td} text-right`}>{editable && <Link href={`/admin/delivery-zones?edit=${z._id}`} className="underline">Edit</Link>}</td>
              </tr>
            );
          }) : <EmptyRow cols={5} text="No zones yet: checkout can't take orders without one." />}
        </tbody>
      </Table>
    </>
  );
}
