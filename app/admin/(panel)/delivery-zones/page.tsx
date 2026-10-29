import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/server/admin/guard";
import { can } from "@/server/auth/rbac";
import { getSettings } from "@/server/services/settings";
import { DeliveryZoneModel } from "@/models";
import { formatMoney, toDollars } from "@/lib/money";
import { countryName, EUROPE } from "@/lib/address";
import { ZoneForm, type ZoneValue } from "@/components/admin/CatalogForms";
import { Badge, Card, EmptyRow, PageHeader, ReadOnlyNote, Table, TableSkeleton, td, th } from "@/components/admin/ui";

export const metadata = { title: "Delivery options" };

export default function ZonesPage(props: PageProps<"/admin/delivery-zones">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Zones {...props} />
    </Suspense>
  );
}

const covers = (countries: string[]) => {
  if (!countries.length) return "Rest of the world (every country no other option lists)";
  if (EUROPE.every((c) => countries.includes(c))) return countries.length === EUROPE.length ? "Europe" : `Europe + ${countries.filter((c) => !EUROPE.includes(c)).map(countryName).join(", ")}`;
  return countries.length > 4 ? `${countries.slice(0, 4).map(countryName).join(", ")} + ${countries.length - 4} more` : countries.map(countryName).join(", ");
};

async function Zones({ searchParams }: PageProps<"/admin/delivery-zones">) {
  const admin = await requireAdminPage("catalog.view");
  const editable = can(admin.role, "catalog.edit");
  const { edit } = await searchParams;
  const [zones, settings] = await Promise.all([DeliveryZoneModel.find().sort({ sortOrder: 1 }).lean(), getSettings()]);

  let form: ZoneValue | null = null;
  if (editable && edit === "new") form = { name: "", fee: "", etaMinDays: 3, etaMaxDays: 5, countries: [], freeEligible: false, note: "", sortOrder: (zones.at(-1)?.sortOrder ?? 0) + 1, isActive: true };
  else if (editable && typeof edit === "string") {
    const z = zones.find((x) => String(x._id) === edit);
    if (!z) notFound();
    form = { id: String(z._id), name: z.name, fee: toDollars(z.fee), etaMinDays: z.etaMinDays, etaMaxDays: z.etaMaxDays, countries: z.countries ?? [], freeEligible: Boolean(z.freeEligible), note: z.note ?? "", sortOrder: z.sortOrder, isActive: z.isActive };
  }

  return (
    <>
      <PageHeader
        title="Delivery options"
        text={`Options marked "free over" cost nothing once the order reaches ${formatMoney(settings.freeDeliveryThreshold)} (after discounts). Change the threshold in Settings.`}
        actions={editable && !form && <Link href="/admin/delivery-zones?edit=new" className="label inline-flex h-10 items-center rounded-md bg-ink px-4 text-paper hover:bg-charcoal">Add option</Link>}
      />
      {!editable && <ReadOnlyNote />}
      {form && (
        <Card title={form.id ? `Edit ${form.name}` : "New delivery option"} className="mb-6">
          <ZoneForm key={form.id ?? "new"} initial={form} />
        </Card>
      )}
      <Table minWidth="44rem">
        <thead>
          <tr><th className={th}>Option</th><th className={th}>Countries</th><th className={`${th} text-right`}>Fee</th><th className={th}>Delivery time</th><th className={th} /></tr>
        </thead>
        <tbody>
          {zones.length ? zones.map((z) => {
            return (
              <tr key={String(z._id)}>
                <td className={td}><span className="font-medium">{z.name}</span> {!z.isActive && <Badge>Off</Badge>}{z.note && <span className="block text-xs text-muted">{z.note}</span>}</td>
                <td className={`${td} max-w-xs text-muted`}>{covers(z.countries ?? [])}</td>
                <td className={`${td} text-right tabular-nums`}>{formatMoney(z.fee)}{z.freeEligible && <span className="block text-xs text-muted">free over {formatMoney(settings.freeDeliveryThreshold)}</span>}</td>
                <td className={td}>{z.etaMinDays}–{z.etaMaxDays} days</td>
                <td className={`${td} text-right`}>{editable && <Link href={`/admin/delivery-zones?edit=${z._id}`} className="underline">Edit</Link>}</td>
              </tr>
            );
          }) : <EmptyRow cols={5} text="No delivery options yet: checkout can't take orders without one." />}
        </tbody>
      </Table>
    </>
  );
}
