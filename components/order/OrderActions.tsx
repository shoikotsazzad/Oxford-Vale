"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { cancelMyOrder } from "@/server/actions/checkout";

export function OrderActions({ orderNo, orderKey, canCancel, payHref, whatsappHref }: { orderNo: string; orderKey?: string; canCancel: boolean; payHref?: string; whatsappHref: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      {payHref && <ButtonLink href={payHref} arrow>{t.order.payNow}</ButtonLink>}
      <a href={whatsappHref} target="_blank" rel="noopener" className="label inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-4 hover:border-ink">
        <WhatsAppIcon size={16} className="text-[#25D366]" /> {t.order.whatsapp}
      </a>
      {canCancel && (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => {
            if (!window.confirm(t.order.cancelConfirm)) return;
            start(async () => {
              const res = await cancelMyOrder({ orderNo, key: orderKey });
              if (res.ok) router.refresh();
              else setError(res.error.message);
            });
          }}
        >
          {t.order.cancel}
        </Button>
      )}
      {error && <p className="w-full text-sm text-danger" role="alert">{error}</p>}
    </>
  );
}
