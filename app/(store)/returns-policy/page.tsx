import { getT } from "@/server/i18n";
import { buildMetadata } from "@/lib/seo";
import { returnsPolicy } from "@/data/pages";
import { PageShell, Sections } from "@/components/store/PageShell";

export const metadata = buildMetadata({ title: returnsPolicy.title, description: returnsPolicy.description, path: "/returns-policy" });

export default async function Page() {
  const t = await getT();
  return (
    <PageShell title={returnsPolicy.title} intro={returnsPolicy.description} homeLabel={t.common.home}>
      <Sections sections={returnsPolicy.sections} />
    </PageShell>
  );
}
