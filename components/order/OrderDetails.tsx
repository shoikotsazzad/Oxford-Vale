import Image from "next/image";
import type { Dict } from "@/lib/i18n";
import { fmt } from "@/lib/i18n";
import { formatBDT } from "@/lib/money";
import { imageSrc, isPlaceholder } from "@/lib/images";
import type { OrderViewDTO } from "@/server/services/order-view";

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;
const dt = (iso: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(new Date(iso));

export function StatusBadge({ text, tone }: { text: string; tone: "ok" | "warn" | "bad" | "neutral" }) {
  const cls = { ok: "bg-success/10 text-success", warn: "bg-sale/10 text-sale", bad: "bg-danger/10 text-danger", neutral: "bg-sand text-ink" }[tone];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{text}</span>;
}

export function OrderDetails({ order, t, actions }: { order: OrderViewDTO; t: Dict; actions?: React.ReactNode }) {
  const step = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const off = step < 0; // cancelled / returned / refunded
  const payTone = order.paymentStatus === "paid" ? "ok" : order.paymentStatus === "failed" ? "bad" : order.awaitingVerification ? "warn" : "neutral";
  const payText = order.awaitingVerification ? t.order.awaiting : t.order.paymentStatuses[order.paymentStatus];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:gap-12">
      <div className="space-y-8">
        <section aria-labelledby="h-status" className="rounded-lg bg-white/60 p-5 ring-1 ring-line md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="h-status" className="font-serif text-2xl">{t.order.status}</h2>
            <StatusBadge text={t.order.statuses[order.status]} tone={off ? "bad" : order.status === "delivered" ? "ok" : "neutral"} />
          </div>
          {!off && (
            <ol className="mt-6 grid grid-cols-5 gap-1" aria-label={t.order.status}>
              {STEPS.map((s, i) => (
                <li key={s} className="text-center">
                  <span className={`block h-1 rounded-full ${i <= step ? "bg-ink" : "bg-line"}`} />
                  <span className={`mt-2 block text-[11px] leading-tight ${i <= step ? "text-ink" : "text-muted"}`} aria-current={i === step ? "step" : undefined}>{t.order.statuses[s]}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-5 text-sm text-muted">{fmt(t.order.eta, { min: order.delivery.etaMinDays, max: order.delivery.etaMaxDays })}</p>
          {order.shipment && (
            <p className="mt-1 text-sm">
              {fmt(t.order.shippedWith, { courier: order.shipment.courier })}
              {order.shipment.trackingNo && <> · {t.order.tracking}: <span className="font-mono">{order.shipment.trackingNo}</span></>}
            </p>
          )}
          {actions && <div className="mt-5 flex flex-wrap gap-3">{actions}</div>}
        </section>

        <section aria-labelledby="h-items">
          <h2 id="h-items" className="font-serif text-2xl">{t.order.items}</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {order.items.map((i) => {
              const src = imageSrc(i.image);
              return (
                <li key={i.sku} className="flex gap-4 py-4">
                  <span className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-sand">
                    <Image src={src} alt="" fill sizes="80px" className="object-cover" unoptimized={isPlaceholder(src)} />
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block">{i.name}</span>
                    <span className="block text-xs text-muted">{i.size !== "One Size" && `${i.size} · `}{i.colour} · {i.sku}</span>
                    <span className="mt-1 block text-xs text-muted">{i.qty} × {formatBDT(i.unitPrice)}</span>
                  </span>
                  <span className="text-sm">{formatBDT(i.lineTotal)}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="h-timeline">
          <h2 id="h-timeline" className="font-serif text-2xl">{t.order.timeline}</h2>
          <ol className="mt-4 space-y-3 border-l border-line pl-5">
            {[...order.history].reverse().map((h, i) => (
              <li key={i} className="relative text-sm">
                <span className="absolute top-1.5 -left-[25px] h-2 w-2 rounded-full bg-ink" aria-hidden="true" />
                <span className="font-medium">{t.order.statuses[h.status]}</span>
                {h.note && <span className="text-ink/80"> · {h.note}</span>}
                <span className="block text-xs text-muted">{dt(h.at)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <aside className="space-y-6 self-start">
        <div className="rounded-lg bg-white/60 p-5 ring-1 ring-line md:p-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>{t.checkout.subtotal}</dt><dd>{formatBDT(order.subtotal)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between text-success"><dt>{t.checkout.discount}{order.couponCode && ` (${order.couponCode})`}</dt><dd>−{formatBDT(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt>{t.checkout.deliveryFee} · {order.delivery.name}</dt><dd>{order.delivery.fee ? formatBDT(order.delivery.fee) : t.checkout.free}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-medium"><dt>{t.checkout.total}</dt><dd>{formatBDT(order.total)}</dd></div>
          </dl>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-sm">
            <span>{t.order.payment}: {t.order.methods[order.paymentMethod]}</span>
            <StatusBadge text={payText} tone={payTone} />
          </div>
          {order.trxId && <p className="mt-2 text-xs text-muted">{t.order.trx}: {order.trxId}</p>}
        </div>
        <div className="rounded-lg bg-white/60 p-5 text-sm ring-1 ring-line md:p-6">
          <p className="label text-muted">{t.order.deliverTo}</p>
          <p className="mt-2">{order.address.name} · {order.address.phone}<br />{order.address.addressLine}<br />{order.address.upazila}, {order.address.district}, {order.address.division}</p>
          {order.note && <><p className="label mt-4 text-muted">{t.order.note}</p><p className="mt-1 whitespace-pre-line">{order.note}</p></>}
        </div>
      </aside>
    </div>
  );
}
