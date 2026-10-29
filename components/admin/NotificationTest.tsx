"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { sendTestNotification } from "@/server/actions/admin/store";
import { FormStatus, useAdminAction } from "./useAdminAction";

export type ProviderStatus = { email: string; emailReady: boolean; stripe: string; paypal: string };

const describeEmail = (name: string, ready: boolean) =>
  name === "log" ? "log mode: messages are only written to the console and the Messages page" : ready ? `${name}: credentials set` : `${name}: credentials missing in .env.local`;
const describePayment = (mode: string) =>
  mode === "mock" ? "mock mode: a built-in test page, no real money (add keys to .env.local)" : mode === "test" ? "test / sandbox keys set" : "live keys set: real payments";

export function NotificationTest({ status, defaultEmail }: { status: ProviderStatus; defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const { run, pending, error, fields, message } = useAdminAction();
  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold">Email &amp; payments</h2>
      <p className="mt-1 text-xs text-muted">Providers are set in environment variables (see .env.example). Order, shipping, contact and abandoned-cart emails use them automatically.</p>
      <dl className="mt-4 grid gap-1 text-sm sm:grid-cols-[5rem_1fr]">
        <dt className="text-muted">Email</dt><dd>{describeEmail(status.email, status.emailReady)}</dd>
        <dt className="text-muted">Stripe</dt><dd>{describePayment(status.stripe)}</dd>
        <dt className="text-muted">PayPal</dt><dd>{describePayment(status.paypal)}</dd>
      </dl>
      <div className="mt-4 flex max-w-lg items-end gap-2">
        <TextField className="min-w-0 flex-1" label="Send a test email to" name="testEmail" type="email" value={email} error={fields.to} onChange={(e) => setEmail(e.target.value)} />
        <Button variant="secondary" disabled={pending || !email} onClick={() => run(() => sendTestNotification({ channel: "email", to: email }), { success: "Test email sent. Check Messages → Sent emails for the log." })}>Send</Button>
      </div>
      <div className="mt-4 empty:hidden"><FormStatus error={error} message={message} /></div>
    </section>
  );
}
