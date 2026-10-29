import { getT } from "@/server/i18n";
import { buildMetadata } from "@/lib/seo";
import { sizeGuide } from "@/data/pages";
import { PageShell } from "@/components/store/PageShell";

export const metadata = buildMetadata({ title: sizeGuide.title, description: sizeGuide.description, path: "/size-guide" });

export default async function SizeGuidePage() {
  const t = await getT();
  return (
    <PageShell title={sizeGuide.title} intro={sizeGuide.intro} homeLabel={t.common.home}>
      <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
        <section>
          <h2 className="font-serif text-2xl">How to measure</h2>
          <dl className="mt-4 space-y-4">
            {sizeGuide.howTo.map((h) => (
              <div key={h.label}>
                <dt className="label">{h.label}</dt>
                <dd className="mt-1 text-sm text-ink/80">{h.text}</dd>
              </div>
            ))}
          </dl>
        </section>
        <div className="space-y-10">
          {sizeGuide.tables.map((tbl) => (
            <section key={tbl.title}>
              <h2 className="font-serif text-xl">{tbl.title}</h2>
              <div className="mt-3 overflow-x-auto rounded-lg border border-line">
                <table className="w-full min-w-[320px] text-left text-sm">
                  <thead className="bg-sand">
                    <tr>{tbl.head.map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-line bg-surface/50">
                    {tbl.rows.map((r) => (
                      <tr key={r[0]}>{r.map((c, i) => (i === 0 ? <th key={i} scope="row" className="px-4 py-2.5 font-medium">{c}</th> : <td key={i} className="px-4 py-2.5">{c}</td>))}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
