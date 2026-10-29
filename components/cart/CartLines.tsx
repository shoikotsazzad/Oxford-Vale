"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Price } from "@/components/ui/Price";
import { formatMoney } from "@/lib/money";
import { imageSrc, isPlaceholder } from "@/lib/images";
import type { CartLineDTO } from "@/lib/types";
import { useCart } from "./CartProvider";
import { QtyInput } from "./QtyInput";

function Line({ line, compact, onNavigate }: { line: CartLineDTO; compact?: boolean; onNavigate?: () => void }) {
  const { t } = useI18n();
  const { setQty, remove } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<{ message: string } | null>) {
    setBusy(true);
    setError(null);
    const err = await fn();
    setBusy(false);
    if (err) setError(err.message);
  }

  const src = imageSrc(line.image);
  return (
    <li className={`flex gap-4 py-5 ${busy ? "opacity-60" : ""}`}>
      <Link href={`/product/${line.slug}`} onClick={onNavigate} className={`relative shrink-0 overflow-hidden rounded-md bg-sand ${compact ? "h-28 w-22" : "h-36 w-28"}`}>
        <Image src={src} alt={line.name} fill sizes="112px" className="object-cover" unoptimized={isPlaceholder(src)} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <Link href={`/product/${line.slug}`} onClick={onNavigate} className="text-sm leading-snug hover:underline underline-offset-4">{line.name}</Link>
          <span className="shrink-0 text-sm">{formatMoney(line.lineTotal)}</span>
        </div>
        <p className="mt-1 text-xs text-muted">
          {line.size !== "One Size" && <>{t.cart.size}: {line.size} · </>}{t.cart.colour}: {line.colour}
        </p>
        <Price price={line.regularPrice} salePrice={line.unitPrice < line.regularPrice ? line.unitPrice : null} className="mt-1 text-xs text-muted" />
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <QtyInput size="sm" value={line.qty} max={line.maxQty} disabled={busy} onChange={(n) => run(() => setQty(line.variantId, n))} />
          <button type="button" disabled={busy} onClick={() => run(() => remove(line.variantId))} className="min-h-9 text-xs text-muted underline underline-offset-4 hover:text-ink">
            {t.cart.remove}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-danger" role="alert">{error}</p>}
      </div>
    </li>
  );
}

export function CartLines({ lines, compact, onNavigate }: { lines: CartLineDTO[]; compact?: boolean; onNavigate?: () => void }) {
  return (
    <ul className="divide-y divide-line">
      {lines.map((l) => <Line key={l.variantId} line={l} compact={compact} onNavigate={onNavigate} />)}
    </ul>
  );
}

export function FreeDeliveryBar({ gap, threshold }: { gap: number; threshold: number }) {
  const { t } = useI18n();
  if (threshold <= 0) return null;
  const pct = Math.min(100, Math.round(((threshold - gap) / threshold) * 100));
  return (
    <div>
      <p className="text-xs">{gap > 0 ? t.cart.freeGap.replace("{amount}", formatMoney(gap)) : t.cart.freeReached}</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CartNotices({ notices }: { notices: string[] }) {
  if (!notices.length) return null;
  return (
    <ul className="space-y-1 rounded-md bg-sale/10 px-4 py-3 text-xs text-sale" role="status">
      {notices.map((n) => <li key={n}>{n}</li>)}
    </ul>
  );
}
