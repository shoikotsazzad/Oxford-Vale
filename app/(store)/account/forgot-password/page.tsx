import { getT } from "@/server/i18n";
import { buildMetadata } from "@/lib/seo";
import { AuthLink, AuthShell } from "@/components/account/AuthShell";
import { ForgotForm } from "@/components/account/AuthForms";

export const metadata = buildMetadata({ title: "Forgot password", path: "/account/forgot-password", noindex: true });

export default async function ForgotPage() {
  const t = await getT();
  return (
    <AuthShell title={t.account.forgotTitle} text={t.account.forgotText} footer={<AuthLink href="/account/login">{t.account.login}</AuthLink>}>
      <ForgotForm />
    </AuthShell>
  );
}
