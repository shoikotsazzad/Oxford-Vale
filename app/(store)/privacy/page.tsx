import { getT } from "@/server/i18n";
import { buildMetadata } from "@/lib/seo";
import { privacy } from "@/data/pages";
import { PageShell, Sections } from "@/components/store/PageShell";

export const metadata = buildMetadata({ title: privacy.title, description: privacy.description, path: "/privacy" });

export default async function Page() {
  const t = await getT();
  return (
    <PageShell title={privacy.title} intro={privacy.description} homeLabel={t.common.home}>
      <Sections sections={privacy.sections} />
    </PageShell>
  );
}
