import { pages } from "@/data/pages";
import { terms } from "@/data/legal";
import { buildMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/LegalPage";

export const metadata = buildMetadata("terms");

export default function TermsPage() {
  return <LegalPage title={pages.terms.title} sections={terms} />;
}
