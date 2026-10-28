"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { sendTestNotification } from "@/server/actions/admin/store";
import { FormStatus, useAdminAction } from "./useAdminAction";

export type ProviderStatus = { email: string; emailReady: boolean; sms: string; smsReady: boolean };

const describe = (name: string, ready: boolean) =>
  name === "log" ? "log mode: messages are only written to the console and the Messages page" : ready ? `${name}: credentials set` : `${name}: credentials missing in .env.local`;

export function NotificationTest({ status, defaultEmail }: { status: ProviderStatus; defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState("");
  const [last, setLast] = useState<"email" | "sms">("email");
  const { run, pending, error, fields, message } = useAdminAction();
  const send = (channel: "email" | "sms") => {
    setLast(channel);
    run(() => sendTestNotification(channel === "email" ? { channel, to: email } : { channel, to: phone }), {
      success: `Test ${channel === "email" ? "email" : "SMS"} sent. Check Messages → Sent emails & SMS for the log.`,
    });
  };
  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-sm font-semibold">Email &amp; SMS</h2>
      <p className="mt-1 text-xs text-muted">Providers are set in environment variables (see .env.example). Order, shipping, contact and abandoned-cart messages use them automatically.</p>
      <dl className="mt-4 grid gap-1 text-sm sm:grid-cols-[5rem_1fr]">
        <dt className="text-muted">Email</dt><dd>{describe(status.email, status.emailReady)}</dd>
        <dt className="text-muted">SMS</dt><dd>{describe(status.sms, status.smsReady)}</dd>
      </dl>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="flex items-end gap-2">
          <TextField className="min-w-0 flex-1" label="Send a test email to" name="testEmail" type="email" value={email} error={last === "email" ? fields.to : undefined} onChange={(e) => setEmail(e.target.value)} />
          <Button variant="secondary" disabled={pending || !email} onClick={() => send("email")}>Send</Button>
        </div>
        <div className="flex items-end gap-2">
          <TextField className="min-w-0 flex-1" label="Send a test SMS to" name="testPhone" inputMode="tel" placeholder="01XXXXXXXXX" value={phone} error={last === "sms" ? fields.to : undefined} onChange={(e) => setPhone(e.target.value)} />
          <Button variant="secondary" disabled={pending || !phone} onClick={() => send("sms")}>Send</Button>
        </div>
      </div>
      <div className="mt-4 empty:hidden"><FormStatus error={error} message={message} /></div>
    </section>
  );
}
