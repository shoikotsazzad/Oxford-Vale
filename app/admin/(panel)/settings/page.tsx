import { Suspense } from "react";
import { requireAdminPage } from "@/server/admin/guard";
import { getSettings } from "@/server/services/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { NotificationTest, type ProviderStatus } from "@/components/admin/NotificationTest";
import { PageHeader, TableSkeleton } from "@/components/admin/ui";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  await requireAdminPage("settings");
  const s = await getSettings();
  // Exactly two hero buttons in the form.
  const ctas = [0, 1].map((i) => s.hero.ctas[i] ?? { label: "", href: "" });
  // Provider names and whether credentials exist only: never the values.
  const env = process.env;
  const status: ProviderStatus = {
    email: env.EMAIL_PROVIDER || "log",
    emailReady: Boolean(env.SMTP_HOST && env.EMAIL_FROM),
    sms: env.SMS_PROVIDER || "log",
    smsReady: env.SMS_PROVIDER === "sslwireless" ? Boolean(env.SSLWIRELESS_API_TOKEN && env.SSLWIRELESS_SID) : Boolean(env.BULKSMSBD_API_KEY && env.BULKSMSBD_SENDER_ID),
  };
  return (
    <>
      <PageHeader title="Settings" text="Store details, home page text, delivery and payment options. Only owners can change these." />
      <div className="mb-6"><NotificationTest status={status} defaultEmail={s.contact.ordersEmail} /></div>
      <SettingsForm initial={{ ...s, hero: { ...s.hero, ctas } }} />
    </>
  );
}
