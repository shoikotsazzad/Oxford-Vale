"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { retryOnlinePayment, submitManualPayment, switchToCod, trackOrder } from "@/server/actions/checkout";

export function ManualPaymentForm({ orderNo, orderKey }: { orderNo: string; orderKey: string }) {
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
          const res = await submitManualPayment({ ...fd, orderNo, key: orderKey });
          if (res.ok) router.push(res.data.next);
          else {
            setErrors(res.error.fields ?? {});
            setMsg(res.error.fields ? null : res.error.message);
          }
        });
      }}
    >
      <TextField label={t.pay.trxId} name="trxId" autoComplete="off" autoCapitalize="characters" placeholder="e.g. 9BG7XK2LQP" error={errors.trxId} required />
      <TextField label={t.pay.sender} name="senderNumber" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" error={errors.senderNumber} required />
      {msg && <p className="text-sm text-danger" role="alert">{msg}</p>}
      <Button type="submit" className="w-full" disabled={pending} arrow={!pending}>{pending ? t.common.loading : t.pay.submit}</Button>
    </form>
  );
}

export function RetryPayment({ orderNo, orderKey, codEnabled }: { orderNo: string; orderKey: string; codEnabled: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const run = (fn: typeof retryOnlinePayment, external: boolean) =>
    start(async () => {
      const res = await fn({ orderNo, key: orderKey });
      if (!res.ok) return setMsg(res.error.message);
      if (external) window.location.assign(res.data.next);
      else router.push(res.data.next);
    });
  return (
    <div className="space-y-3">
      <Button className="w-full" disabled={pending} onClick={() => run(retryOnlinePayment, true)} arrow>{t.pay.retry}</Button>
      {codEnabled && <Button variant="secondary" className="w-full" disabled={pending} onClick={() => run(switchToCod, false)}>{t.pay.switchCod}</Button>}
      {msg && <p className="text-sm text-danger" role="alert">{msg}</p>}
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
      <TextField label={t.checkout.phone} name="phone" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" error={errors.phone} required />
      {msg && <p className="text-sm text-danger" role="alert">{msg}</p>}
      <Button type="submit" className="w-full" disabled={pending} arrow={!pending}>{pending ? t.common.loading : t.order.find}</Button>
    </form>
  );
}
