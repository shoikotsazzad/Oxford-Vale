import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getT } from "@/server/i18n";
import { getCurrentUser } from "@/server/auth/session";
import { buildMetadata } from "@/lib/seo";
import { safeNext } from "@/lib/safe-next";
import { AuthLink, AuthShell } from "@/components/account/AuthShell";
import { LoginForm } from "@/components/account/AuthForms";

export const metadata = buildMetadata({ title: "Log in", path: "/account/login", noindex: true });

export default function LoginPage(props: PageProps<"/account/login">) {
  return (
    <Suspense>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ searchParams }: PageProps<"/account/login">) {
  const [sp, t, user] = await Promise.all([searchParams, getT(), getCurrentUser()]);
  const next = safeNext(sp.next);
  if (user) redirect(next);
  return (
    <AuthShell title={t.account.loginTitle} footer={<>{t.account.noAccount} <AuthLink href={`/account/register?next=${encodeURIComponent(next)}`}>{t.account.register}</AuthLink></>}>
      <LoginForm next={next} />
    </AuthShell>
  );
}
