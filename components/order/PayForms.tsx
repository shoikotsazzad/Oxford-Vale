"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { retryOnlinePayment, trackOrder } from "@/server/actions/checkout";
import type { PaymentMethod } from "@/models/enums";

/** Pay page: start a new payment with Stripe or PayPal (whichever the store has switched on). */
export function RetryPayment({ orderNo, orderKey, methods }: { orderNo: string; orderKey: string; methods: { id: PaymentMethod; label: string }[] }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const run = (method: PaymentMethod) =>
    start(async () => {
      const res = await retryOnlinePayment({ orderNo, key: orderKey, method });
      if (!res.ok) return setMsg(res.error.message);
      window.location.assign(res.data.next);
    });
  return (
    <div className="space-y-3">
      {methods.map((m, i) => (
        <Button key={m.id} variant={i === 0 ? "primary" : "secondary"} className="w-full" disabled={pending} onClick={() => run(m.id)} arrow={i === 0}>
          {m.label}
        </Button>
      ))}
      {msg && <p className="text-sm text-danger" role="alert">{msg}</p>}
      <p className="text-center text-xs text-muted">{t.pay.secure}</p>
    </div>
  );
}

export function TrackOrderForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.currentTarget));
        start(async () => {
          const res = await trackOrder(fd);
          if (res.ok) router.push(res.data.next);
          else {
            setErrors(res.error.fields ?? {});
            setMsg(res.error.fields ? null : res.error.message);
          }
        });
      }}
    >
      <TextField label={t.order.orderNo} name="orderNo" placeholder="OV-261022-0001" autoCapitalize="characters" error={errors.orderNo} required />
      <TextField label={t.order.trackContact} name="contact" autoComplete="email" placeholder="you@example.com or 07700 900123" error={errors.contact} required />
      {msg && <p className="text-sm text-danger" role="alert">{msg}</p>}
      <Button type="submit" className="w-full" disabled={pending} arrow={!pending}>{pending ? t.common.loading : t.order.find}</Button>
    </form>
  );
}
