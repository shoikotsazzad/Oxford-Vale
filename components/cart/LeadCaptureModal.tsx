"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/icons";
import type { ActionError } from "@/server/result";

type Props = {
  onSubmit: (data: { name: string; phone: string; email: string }) => Promise<ActionError | null>;
  onSkip: () => Promise<void>;
};

const input = "mt-1.5 block min-h-12 w-full rounded-md border bg-white px-3 text-base outline-none focus:border-ink";

/** Shown on the first add-to-cart. Skipping still keeps the item in the bag; details are then asked at checkout. */
export function LeadCaptureModal({ onSubmit, onSkip }: Props) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [error, setError] = useState<ActionError | null>(null);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && start(onSkip);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onSkip]);

  const fieldErr = (k: string) => error?.fields?.[k];
  const cls = (k: string) => `${input} ${fieldErr(k) ? "border-danger" : "border-line"}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/50" onClick={() => start(onSkip)} />
      <div role="dialog" aria-modal="true" aria-labelledby="lead-title" className="relative w-full max-w-md rounded-t-2xl bg-paper p-6 shadow-xl sm:rounded-2xl sm:p-8">
        <button type="button" onClick={() => start(onSkip)} aria-label={t.nav.close} className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center"><CloseIcon /></button>
        <p className="label text-muted">{t.cart.added}</p>
        <h2 id="lead-title" className="mt-2 font-serif text-3xl">{t.lead.title}</h2>
        <p className="mt-2 text-sm text-muted">{t.lead.text}</p>
        <form
          noValidate
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.currentTarget)) as { name: string; phone: string; email: string };
            start(async () => setError(await onSubmit(data)));
          }}
        >
          {([
            ["name", t.lead.name, "text", "name", undefined],
            ["phone", t.lead.phone, "tel", "tel", "01XXXXXXXXX"],
            ["email", t.lead.email, "email", "email", undefined],
          ] as const).map(([name, label, type, auto, ph]) => (
            <div key={name}>
              <label htmlFor={`lead-${name}`} className="text-sm">{label}</label>
              <input
                ref={name === "name" ? first : undefined}
                id={`lead-${name}`}
                name={name}
                type={type}
                autoComplete={auto}
                placeholder={ph}
                inputMode={type === "tel" ? "tel" : undefined}
                required
                aria-invalid={Boolean(fieldErr(name))}
                aria-describedby={fieldErr(name) ? `lead-${name}-err` : undefined}
                className={cls(name)}
              />
              {fieldErr(name) && <p id={`lead-${name}-err`} className="mt-1 text-sm text-danger">{fieldErr(name)}</p>}
            </div>
          ))}
          {error && !error.fields && <p className="text-sm text-danger" role="alert">{error.message}</p>}
          <Button type="submit" className="w-full" disabled={pending} arrow={!pending}>{pending ? t.common.loading : t.lead.submit}</Button>
          <button type="button" onClick={() => start(onSkip)} disabled={pending} className="block min-h-11 w-full text-center text-sm text-muted underline underline-offset-4 hover:text-ink">
            {t.lead.skip}
          </button>
          <p className="text-center text-xs text-muted">{t.lead.privacy}</p>
        </form>
      </div>
    </div>
  );
}
