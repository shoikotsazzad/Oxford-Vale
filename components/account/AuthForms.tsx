"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { forgotPassword, login, register, resetPassword } from "@/server/actions/auth";
import type { Result } from "@/server/result";

/** Shared submit handling: field errors, top-level message, redirect on success. */
function useAuthForm<T>(action: (input: unknown) => Promise<Result<T>>, onDone: (data: T) => void) {
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const onSubmit = (extra: Record<string, unknown> = {}) => (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = { ...Object.fromEntries(new FormData(e.currentTarget)), ...extra };
    start(async () => {
      const res = await action(data);
      if (res.ok) {
        setErrors({});
        setMessage(null);
        onDone(res.data);
      } else {
        setErrors(res.error.fields ?? {});
        setMessage(res.error.fields ? null : res.error.message);
      }
    });
  };
  return { pending, errors, message, onSubmit };
}

function Alert({ text, tone = "bad" }: { text: string | null; tone?: "bad" | "ok" }) {
  if (!text) return null;
  return <p role={tone === "bad" ? "alert" : "status"} className={`rounded-md px-4 py-3 text-sm ${tone === "bad" ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>{text}</p>;
}

export function LoginForm({ next }: { next: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const f = useAuthForm(login, (d) => { router.push(d.next); router.refresh(); });
  return (
    <form noValidate onSubmit={f.onSubmit({ next })} className="space-y-4">
      <Alert text={f.message} />
      <TextField label={t.account.email} name="email" type="email" autoComplete="email" error={f.errors.email} required />
      <TextField label={t.account.password} name="password" type="password" autoComplete="current-password" error={f.errors.password} required />
      <div className="text-right"><Link href="/account/forgot-password" className="text-sm underline underline-offset-4">{t.account.forgot}</Link></div>
      <Button type="submit" className="w-full" disabled={f.pending} arrow={!f.pending}>{f.pending ? t.common.loading : t.account.login}</Button>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const f = useAuthForm(register, (d) => { router.push(d.next); router.refresh(); });
  return (
    <form noValidate onSubmit={f.onSubmit({ next })} className="space-y-4">
      <Alert text={f.message} />
      <TextField label={t.account.name} name="name" autoComplete="name" error={f.errors.name} required />
      <TextField label={t.account.email} name="email" type="email" autoComplete="email" error={f.errors.email} required />
      <TextField label={t.account.phone} name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" error={f.errors.phone} required />
      <TextField label={t.account.password} name="password" type="password" autoComplete="new-password" hint={t.checkout.passwordHint} error={f.errors.password} required />
      <Button type="submit" className="w-full" disabled={f.pending} arrow={!f.pending}>{f.pending ? t.common.loading : t.account.register}</Button>
    </form>
  );
}

export function ForgotForm() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  const f = useAuthForm(forgotPassword, () => setSent(true));
  if (sent) return <Alert tone="ok" text={t.account.linkSent} />;
  return (
    <form noValidate onSubmit={f.onSubmit()} className="space-y-4">
      <Alert text={f.message} />
      <TextField label={t.account.email} name="email" type="email" autoComplete="email" error={f.errors.email} required />
      <Button type="submit" className="w-full" disabled={f.pending}>{f.pending ? t.common.loading : t.account.sendLink}</Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const f = useAuthForm(resetPassword, (d) => { router.push(d.next); router.refresh(); });
  return (
    <form noValidate onSubmit={f.onSubmit({ token })} className="space-y-4">
      <Alert text={f.message} />
      <TextField label={t.account.newPassword} name="password" type="password" autoComplete="new-password" hint={t.checkout.passwordHint} error={f.errors.password} required />
      <TextField label={t.account.confirm} name="confirm" type="password" autoComplete="new-password" error={f.errors.confirm} required />
      <Button type="submit" className="w-full" disabled={f.pending}>{f.pending ? t.common.loading : t.account.savePassword}</Button>
    </form>
  );
}
