import { getT } from "@/server/i18n";
import { getSettings } from "@/server/services/settings";
import { getZones } from "@/server/services/delivery";
import { buildMetadata } from "@/lib/seo";
import { formatMoney } from "@/lib/money";
import { shippingPolicy } from "@/data/pages";
import { PageShell, Sections } from "@/components/store/PageShell";

export const metadata = buildMetadata({ title: shippingPolicy.title, description: shippingPolicy.description, path: "/shipping-policy" });

export default async function ShippingPolicyPage() {
  const [t, settings, zones] = await Promise.all([getT(), getSettings(), getZones()]);
  return (
    <PageShell title={shippingPolicy.title} intro={shippingPolicy.description} homeLabel={t.common.home}>
      <div className="max-w-3xl">
        <h2 className="font-serif text-2xl">Delivery fees and times</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand">
              <tr><th scope="col" className="px-4 py-3 font-medium">Option</th><th scope="col" className="px-4 py-3 font-medium">Fee</th><th scope="col" className="px-4 py-3 font-medium">Delivery time</th></tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface/50">
              {zones.map((z) => (
                <tr key={z.id}>
                  <th scope="row" className="px-4 py-2.5 font-medium">{z.name}{z.note && <span className="block text-xs font-normal text-muted">{z.note}</span>}</th>
                  <td className="px-4 py-2.5">{formatMoney(z.fee)}{z.freeEligible && settings.freeDeliveryThreshold > 0 && <span className="block text-xs text-muted">Free over {formatMoney(settings.freeDeliveryThreshold)}</span>}</td>
                  <td className="px-4 py-2.5">{z.etaMinDays}–{z.etaMaxDays} working days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {settings.freeDeliveryThreshold > 0 && (
          <p className="mt-4 rounded-md bg-ink px-4 py-3 text-sm text-paper">Free UK standard delivery on orders over {formatMoney(settings.freeDeliveryThreshold)} (after discounts).</p>
        )}
        <div className="mt-10"><Sections sections={shippingPolicy.sections} /></div>
      </div>
    </PageShell>
  );
}
