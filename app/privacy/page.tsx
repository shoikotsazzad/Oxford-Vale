import { pages } from "@/data/pages";
import { privacy } from "@/data/legal";
import { buildMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/LegalPage";

export const metadata = buildMetadata("privacy");

export default function PrivacyPage() {
  return <LegalPage title={pages.privacy.title} sections={privacy} />;
}
