import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getT } from "@/server/i18n";
import { getCurrentUser } from "@/server/auth/session";
import { buildMetadata } from "@/lib/seo";
import { safeNext } from "@/lib/safe-next";
import { AuthLink, AuthShell } from "@/components/account/AuthShell";
import { RegisterForm } from "@/components/account/AuthForms";

export const metadata = buildMetadata({ title: "Create account", path: "/account/register", noindex: true });

export default function RegisterPage(props: PageProps<"/account/register">) {
  return (
    <Suspense>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ searchParams }: PageProps<"/account/register">) {
  const [sp, t, user] = await Promise.all([searchParams, getT(), getCurrentUser()]);
  const next = safeNext(sp.next);
  if (user) redirect(next);
  return (
    <AuthShell title={t.account.registerTitle} text={t.account.registerText} footer={<>{t.account.haveAccount} <AuthLink href={`/account/login?next=${encodeURIComponent(next)}`}>{t.account.login}</AuthLink></>}>
      <RegisterForm next={next} />
    </AuthShell>
  );
}
