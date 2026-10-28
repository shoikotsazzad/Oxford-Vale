import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/server/admin/guard";
import { TRANSITIONS } from "@/server/services/order-admin";
import { orderUrl } from "@/server/services/payment-redirect";
import { OrderModel, UserModel, isAwaitingVerification } from "@/models";
import { formatBDT } from "@/lib/money";
import { Thumb } from "@/components/admin/Thumb";
import { telLink, whatsappLink } from "@/lib/contact";
import { NoteForm, PaymentVerifyControl, StatusControl } from "@/components/admin/OrderControls";
import { Badge, Card, dateTime, label, OrderStatusBadge, PageHeader, PaymentBadge, TableSkeleton } from "@/components/admin/ui";

const METHOD: Record<string, string> = { cod: "Cash on delivery", sslcommerz: "SSLCommerz (card / mobile banking)", bkash: "bKash", nagad: "Nagad" };

export async function generateMetadata({ params }: PageProps<"/admin/orders/[orderNo]">) {
  return { title: `Order ${(await params).orderNo}` };
}

export default function OrderPage(props: PageProps<"/admin/orders/[orderNo]">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <OrderDetail {...props} />
    </Suspense>
  );
}

async function OrderDetail({ params }: PageProps<"/admin/orders/[orderNo]">) {
  await requireAdminPage("orders");
  const { orderNo } = await params;
  const o = await OrderModel.findOne({ orderNo }).lean();
  if (!o) notFound();
  const actorIds = [...o.statusHistory.map((h) => h.by), o.payment?.verifiedBy].filter(Boolean).map(String);
  const actors = new Map((await UserModel.find({ _id: { $in: actorIds } }).select("name").lean()).map((u) => [String(u._id), u.name]));
  const awaiting = isAwaitingVerification(o);
  const a = o.shippingAddress!; // required by the schema
  const c = o.customer!;
  const customerLink = orderUrl(o.orderNo);

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/orders" className="text-muted hover:text-ink">← Orders</Link></p>
      <PageHeader
        title={o.orderNo}
        text={`Placed ${dateTime(o.createdAt)}`}
        actions={
          <>
            <a href={`/api/admin/orders/${o.orderNo}/invoice`} className="label inline-flex h-10 items-center rounded-md border border-ink px-4 hover:bg-ink hover:text-white">Invoice PDF</a>
            <a href={customerLink} target="_blank" rel="noreferrer" className="label inline-flex h-10 items-center rounded-md px-3 text-muted hover:text-ink">Customer view</a>
          </>
        }
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <OrderStatusBadge status={o.status} />
        <PaymentBadge status={o.paymentStatus} awaiting={awaiting} />
        <Badge>{METHOD[o.paymentMethod]}</Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-6">
          <Card title={`Items (${o.items.reduce((n, i) => n + i.qty, 0)})`} pad={false}>
            <ul className="divide-y divide-line">
              {o.items.map((i) => (
                <li key={i.sku} className="flex gap-4 px-5 py-4">
                  <Thumb src={i.image} />
                  <div className="min-w-0 flex-1 text-sm">
                    <Link href={`/admin/products/${i.product}`} className="font-medium hover:underline">{i.name}</Link>
                    <p className="text-muted">{[i.size !== "One Size" && i.size, i.colour].filter(Boolean).join(" · ")} · <span className="font-mono text-xs">{i.sku}</span></p>
                    <p className="mt-1 tabular-nums">
                      {i.qty} × {formatBDT(i.unitPrice)}
                      {i.regularPrice > i.unitPrice && <span className="ml-2 text-muted line-through">{formatBDT(i.regularPrice)}</span>}
                    </p>
                  </div>
                  <p className="text-sm tabular-nums">{formatBDT(i.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatBDT(o.subtotal)}</dd></div>
              {o.discount > 0 && <div className="flex justify-between"><dt className="text-muted">Discount {o.couponCode && `(${o.couponCode})`}</dt><dd className="tabular-nums">−{formatBDT(o.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Delivery · {o.delivery?.name}</dt><dd className="tabular-nums">{o.delivery?.fee ? formatBDT(o.delivery.fee) : "Free"}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-medium"><dt>Total</dt><dd className="tabular-nums">{formatBDT(o.total)}</dd></div>
            </dl>
          </Card>

          <Card title="Update status">
            <StatusControl key={o.status} orderNo={o.orderNo} next={TRANSITIONS[o.status].filter((s) => s !== "refunded" || o.paymentStatus === "paid")} paymentMethod={o.paymentStatus === "paid" ? "cod" : o.paymentMethod} />
          </Card>

          <Card title="Timeline">
            <ol className="space-y-4">
              {[...o.statusHistory].reverse().map((h, i) => (
                <li key={i} className="grid grid-cols-[auto_1fr] gap-x-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-ink" aria-hidden="true" />
                  <div>
                    <p><span className="font-medium">{label(h.status ?? "")}</span>{h.note && <span className="text-muted"> · {h.note}</span>}</p>
                    <p className="text-xs text-muted">{dateTime(h.at)}{h.by && ` · ${actors.get(String(h.by)) ?? "Admin"}`}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card title="Payment">
            <dl className="grid grid-cols-[7rem_1fr] gap-y-1.5 text-sm">
              <dt className="text-muted">Method</dt><dd>{METHOD[o.paymentMethod]}</dd>
              <dt className="text-muted">Status</dt><dd><PaymentBadge status={o.paymentStatus} awaiting={awaiting} /></dd>
              {o.payment?.gatewayTranId && <><dt className="text-muted">Gateway ID</dt><dd className="font-mono text-xs break-all">{o.payment.gatewayTranId}</dd></>}
              {o.payment?.trxId && !awaiting && <><dt className="text-muted">Trx ID</dt><dd className="font-mono">{o.payment.trxId}</dd></>}
              {o.payment?.verifiedAt && <><dt className="text-muted">Verified</dt><dd>{dateTime(o.payment.verifiedAt)}{o.payment.verifiedBy && ` by ${actors.get(String(o.payment.verifiedBy)) ?? "admin"}`}</dd></>}
            </dl>
            {awaiting && o.payment?.trxId && (
              <div className="mt-4">
                <PaymentVerifyControl orderNo={o.orderNo} method={o.paymentMethod === "bkash" ? "bKash" : "Nagad"} trxId={o.payment.trxId} senderNumber={o.payment.senderNumber ?? ""} />
              </div>
            )}
          </Card>

          <Card title="Customer">
            <p className="font-medium">{c.name}</p>
            <p className="mt-1 text-sm"><a href={telLink(c.phone)} className="hover:underline">{c.phone}</a> · <a href={whatsappLink(c.phone, `Hello ${c.name}, this is Oxford Vale about your order ${o.orderNo}.`)} target="_blank" rel="noreferrer" className="hover:underline">WhatsApp</a></p>
            {c.email && <p className="text-sm"><a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a></p>}
            <p className="mt-2 text-xs text-muted">{o.user ? "Has an account" : "Guest checkout"} · <Link href={`/admin/orders?q=${c.phone}`} className="underline">Orders from this phone</Link></p>
          </Card>

          <Card title="Delivery">
            <address className="text-sm not-italic">
              {a.name} · {a.phone}<br />{a.addressLine}<br />{a.upazila}, {a.district}<br />{a.division}
            </address>
            <p className="mt-2 text-sm text-muted">{o.delivery?.name} · {o.delivery?.etaMinDays}–{o.delivery?.etaMaxDays} days</p>
            {o.shipment?.courier && <p className="mt-2 text-sm">Shipped with <span className="font-medium">{o.shipment.courier}</span>{o.shipment.trackingNo && <> · <span className="font-mono">{o.shipment.trackingNo}</span></>}</p>}
            {o.note && <p className="mt-3 rounded-md bg-sand/60 px-3 py-2 text-sm"><span className="text-muted">Customer note:</span> {o.note}</p>}
          </Card>

          <Card title="Internal notes">
            {o.internalNotes.length > 0 && (
              <ul className="mb-4 space-y-3">
                {o.internalNotes.map((n, i) => (
                  <li key={i} className="text-sm">
                    <p className="whitespace-pre-line">{n.text}</p>
                    <p className="text-xs text-muted">{n.byName} · {dateTime(n.at)}</p>
                  </li>
                ))}
              </ul>
            )}
            <NoteForm orderNo={o.orderNo} />
          </Card>
        </div>
      </div>
    </>
  );
}
