"use client";
import { useEffect } from "react";
import { useI18n } from "@/components/I18nProvider";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LockIcon } from "@/components/ui/icons";
import { formatBDT } from "@/lib/money";
import type { CartView } from "@/lib/types";
import { useCart } from "./CartProvider";
import { CartLines, CartNotices, FreeDeliveryBar } from "./CartLines";

export function CartPageClient({ initial }: { initial: CartView }) {
  const { t } = useI18n();
  const { view: live, apply } = useCart();
  useEffect(() => apply(initial), [initial, apply]);
  const view = live ?? initial;

  if (!view.lines.length) {
    return (
      <div className="mt-8">
        {view.notices.length > 0 && <div className="mb-6"><CartNotices notices={view.notices} /></div>}
        <EmptyState title={t.cart.empty} text={t.cart.emptyText} action={<ButtonLink href="/shop" arrow>{t.home.shopNow}</ButtonLink>} />
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-14">
      <div>
        <CartNotices notices={view.notices} />
        <div className="border-y border-line"><CartLines lines={view.lines} /></div>
        <ButtonLink href="/shop" variant="secondary" className="mt-6">{t.cart.continue}</ButtonLink>
      </div>
      <aside className="self-start rounded-lg bg-white/60 p-6 ring-1 ring-line lg:sticky lg:top-28">
        <FreeDeliveryBar gap={view.freeDeliveryGap} threshold={view.freeDeliveryThreshold} />
        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between"><dt>{t.cart.subtotal} ({view.count === 1 ? t.cart.itemCountOne : t.cart.itemCount.replace("{n}", String(view.count))})</dt><dd>{formatBDT(view.subtotal)}</dd></div>
        </dl>
        <p className="mt-2 text-xs text-muted">{t.cart.deliveryNote}</p>
        <ButtonLink href="/checkout" className="mt-6 w-full" arrow>{t.cart.checkout}</ButtonLink>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted"><LockIcon size={14} /> Cash on Delivery · bKash · Nagad · Cards</p>
      </aside>
    </div>
  );
}
