// Shared handling for Stripe / PayPal / mock payment results. Every result was already confirmed with the provider
// server-side; this checks it against the order and marks the order paid exactly once.
import { OrderModel, type PaymentMethod } from "@/models";
import type { Confirmation } from "@/server/adapters/payments";
import { formatMoneyExact } from "@/lib/money";
import { markOrderPaid, markPaymentFailed } from "./order";

const LABEL: Record<PaymentMethod, string> = { stripe: "Stripe", paypal: "PayPal" };

export type PaymentOutcome = { ok: true; orderNo: string; newlyPaid: boolean } | { ok: false; orderNo: string | null; reason: string; pending?: boolean };

export async function applyPayment(method: PaymentMethod, c: Confirmation): Promise<PaymentOutcome> {
  if (!c.ok) return c;
  const order = await OrderModel.findOne({ orderNo: c.orderNo }).select("total paymentStatus").lean();
  if (!order) return { ok: false, orderNo: c.orderNo, reason: "Order not found." };
  if (order.paymentStatus === "paid") return { ok: true, orderNo: c.orderNo, newlyPaid: false };
  if (c.currency !== "USD" || c.amount !== order.total) {
    await markPaymentFailed(c.orderNo, `Amount mismatch: paid ${formatMoneyExact(c.amount)} ${c.currency}, expected ${formatMoneyExact(order.total)} USD`);
    return { ok: false, orderNo: c.orderNo, reason: "Amount mismatch." };
  }
  const paid = await markOrderPaid(
    c.orderNo,
    { sessionId: c.sessionId, gatewayTranId: c.gatewayTranId, brand: c.brand, verifiedAt: new Date() },
    `Paid online via ${LABEL[method]} (${c.brand})`,
  );
  // The return redirect and the webhook can both arrive: only the call that marked it paid sends the notification.
  return { ok: true, orderNo: c.orderNo, newlyPaid: Boolean(paid) };
}

export async function failPayment(orderNo: string | null, reason: string) {
  if (orderNo) await markPaymentFailed(orderNo, reason);
}
