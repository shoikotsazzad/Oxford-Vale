import { Suspense } from "react";
import { getT } from "@/server/i18n";
import { buildMetadata } from "@/lib/seo";
import { AuthShell } from "@/components/account/AuthShell";
import { ResetForm } from "@/components/account/AuthForms";

export const metadata = buildMetadata({ title: "Reset password", noindex: true });

export default function ResetPage(props: PageProps<"/account/reset-password/[token]">) {
  return (
    <Suspense>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params }: PageProps<"/account/reset-password/[token]">) {
  const [{ token }, t] = await Promise.all([params, getT()]);
  return (
    <AuthShell title={t.account.resetTitle}>
      <ResetForm token={token} />
    </AuthShell>
  );
}
