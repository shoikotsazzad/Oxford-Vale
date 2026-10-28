"use client";
import { useState } from "react";
import type { OrderStatus } from "@/models/enums";
import { Button } from "@/components/ui/Button";
import { TextArea, TextField } from "@/components/ui/Field";
import { addOrderNote, changeOrderStatus, rejectPayment, verifyPayment } from "@/server/actions/admin/orders";
import { FormStatus, useAdminAction } from "./useAdminAction";

const VERB: Partial<Record<OrderStatus, string>> = {
  confirmed: "Confirm order", processing: "Start processing", shipped: "Mark as shipped", delivered: "Mark as delivered",
  cancelled: "Cancel order", returned: "Mark as returned", refunded: "Mark as refunded",
};
const HELP: Partial<Record<OrderStatus, string>> = {
  cancelled: "Stock and the coupon use are put back.",
  delivered: "Cash on delivery orders are marked paid.",
  refunded: "Record the refund after sending the money back.",
};

export function StatusControl({ orderNo, next, paymentMethod }: { orderNo: string; next: OrderStatus[]; paymentMethod: string }) {
  const [to, setTo] = useState<OrderStatus | "">(next[0] ?? "");
  const [note, setNote] = useState("");
  const [courier, setCourier] = useState("");
  const [trackingNo, setTrackingNo] = useState("");
  const [restock, setRestock] = useState(true);
  const { run, pending, error, fields, message } = useAdminAction();
  if (!next.length) return <p className="text-sm text-muted">This order is closed. No further status changes.</p>;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!to) return;
        if (to === "cancelled" && !window.confirm("Cancel this order? Stock will be returned.")) return;
        run(() => changeOrderStatus({ orderNo, to, note, courier, trackingNo, restock: to === "returned" ? restock : undefined }), {
          success: "Status updated.",
          onOk: () => setNote(""),
        });
      }}
    >
      <fieldset>
        <legend className="text-sm">Move to</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {next.map((s) => (
            <label key={s} className={`flex min-h-10 cursor-pointer items-center rounded-md border px-3 text-sm ${to === s ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}>
              <input type="radio" name="to" value={s} checked={to === s} onChange={() => setTo(s)} className="sr-only" />
              {VERB[s]}
            </label>
          ))}
        </div>
        {to && HELP[to] && <p className="mt-2 text-xs text-muted">{HELP[to]}</p>}
        {to === "confirmed" && paymentMethod !== "cod" && <p className="mt-2 text-xs text-warn">The payment isn&apos;t verified yet. Confirm only if you&apos;ve checked it another way.</p>}
      </fieldset>
      {to === "shipped" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Courier" name="courier" value={courier} onChange={(e) => setCourier(e.target.value)} error={fields.courier} placeholder="Pathao, Steadfast, RedX…" />
          <TextField label="Tracking number (optional)" name="trackingNo" value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} error={fields.trackingNo} />
        </div>
      )}
      {to === "returned" && (
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="h-5 w-5 accent-ink" />
          Put the items back in stock
        </label>
      )}
      <TextArea label="Note for the timeline (optional)" name="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} error={fields.note} hint="Customers see this note on their order page." />
      <FormStatus error={error} message={message} />
      <Button type="submit" disabled={pending || !to} variant={to === "cancelled" ? "secondary" : "primary"}>{pending ? "Saving…" : to ? VERB[to] : "Choose a status"}</Button>
    </form>
  );
}

export function PaymentVerifyControl({ orderNo, method, trxId, senderNumber }: { orderNo: string; method: string; trxId: string; senderNumber: string }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("Transaction ID not found in our account");
  const { run, pending, error, fields, message } = useAdminAction();
  return (
    <div className="space-y-3 rounded-md border border-warn/40 bg-warn/5 p-4">
      <p className="text-sm font-medium text-warn">Check this {method} payment in the merchant app before verifying.</p>
      <dl className="grid grid-cols-[8rem_1fr] gap-y-1 text-sm">
        <dt className="text-muted">Trx ID</dt><dd className="font-mono">{trxId}</dd>
        <dt className="text-muted">Sender</dt><dd className="font-mono">{senderNumber}</dd>
      </dl>
      <FormStatus error={error} message={message} />
      {rejecting ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => rejectPayment({ orderNo, reason }), { success: "Payment rejected. The customer can submit a new Trx ID." });
          }}
        >
          <TextField label="Reason (shown to the customer)" name="reason" value={reason} onChange={(e) => setReason(e.target.value)} error={fields.reason} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="secondary" disabled={pending}>Reject payment</Button>
            <Button onClick={() => setRejecting(false)} variant="secondary" className="border-transparent">Back</Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button disabled={pending} onClick={() => run(() => verifyPayment({ orderNo }), { success: "Payment verified. The order is confirmed." })}>{pending ? "Saving…" : "Verify payment"}</Button>
          <Button variant="secondary" disabled={pending} onClick={() => setRejecting(true)}>Not received</Button>
        </div>
      )}
    </div>
  );
}

export function NoteForm({ orderNo }: { orderNo: string }) {
  const [text, setText] = useState("");
  const { run, pending, error, fields } = useAdminAction();
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => addOrderNote({ orderNo, text }), { onOk: () => setText("") });
      }}
    >
      <TextArea label="Add an internal note" name="noteText" rows={2} value={text} onChange={(e) => setText(e.target.value)} error={fields.text} hint="Only admins see these." />
      <FormStatus error={error} message={null} />
      <Button type="submit" variant="secondary" disabled={pending || !text.trim()}>{pending ? "Saving…" : "Add note"}</Button>
    </form>
  );
}
