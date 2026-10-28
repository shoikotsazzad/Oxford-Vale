"use client";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { sendContactMessage } from "@/server/actions/contact";

const input = "mt-1.5 block min-h-12 w-full rounded-md border bg-white px-3 text-base outline-none focus:border-ink";

export function ContactForm() {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    start(async () => {
      const res = await sendContactMessage(data);
      if (res.ok) {
        form.reset();
        setErrors({});
        setMessage({ ok: true, text: t.contact.sent });
      } else {
        setErrors(res.error.fields ?? {});
        setMessage({ ok: false, text: res.error.message });
      }
    });
  }

  const field = (name: string, label: string, el: React.ReactNode) => (
    <div>
      <label htmlFor={`c-${name}`} className="text-sm">{label}</label>
      {el}
      {errors[name] && <p id={`c-${name}-err`} className="mt-1 text-sm text-danger">{errors[name]}</p>}
    </div>
  );
  const cls = (name: string) => `${input} ${errors[name] ? "border-danger" : "border-line"}`;
  const aria = (name: string) => ({ id: `c-${name}`, name, "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name] ? `c-${name}-err` : undefined });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {field("name", t.contact.name, <input {...aria("name")} autoComplete="name" required className={cls("name")} />)}
        {field("email", t.contact.email, <input {...aria("email")} type="email" autoComplete="email" required className={cls("email")} />)}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {field("phone", t.contact.phone, <input {...aria("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" className={cls("phone")} />)}
        {field("subject", t.contact.subject, <input {...aria("subject")} className={cls("subject")} />)}
      </div>
      {field("message", t.contact.message, <textarea {...aria("message")} rows={6} required className={`${cls("message")} py-3`} />)}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {message && (
        <p role={message.ok ? "status" : "alert"} className={`rounded-md px-4 py-3 text-sm ${message.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={pending} arrow={!pending}>{pending ? t.common.sending : t.common.send}</Button>
    </form>
  );
}
