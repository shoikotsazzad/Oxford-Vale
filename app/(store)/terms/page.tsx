import { getT } from "@/server/i18n";
import { buildMetadata } from "@/lib/seo";
import { terms } from "@/data/pages";
import { PageShell, Sections } from "@/components/store/PageShell";

export const metadata = buildMetadata({ title: terms.title, description: terms.description, path: "/terms" });

export default async function Page() {
  const t = await getT();
  return (
    <PageShell title={terms.title} intro={terms.description} homeLabel={t.common.home}>
      <Sections sections={terms.sections} />
    </PageShell>
  );
}
