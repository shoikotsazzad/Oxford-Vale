import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { Container } from "@/components/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { AccountNav } from "@/components/account/AccountNav";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="py-8 md:py-12">
      <div className="grid gap-8 lg:grid-cols-[13rem_1fr] lg:gap-12">
        <AccountNav />
        <Suspense fallback={<Skeleton className="h-96" />}>
          <Guard>{children}</Guard>
        </Suspense>
      </div>
    </Container>
  );
}

/** Real auth check (proxy.ts only does an optimistic redirect). */
async function Guard({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/account/login?next=/account");
  return <div className="min-w-0">{children}</div>;
}
