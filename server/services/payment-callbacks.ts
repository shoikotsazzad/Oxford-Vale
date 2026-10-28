// Shared handling for SSLCommerz success / IPN / fail / cancel callbacks.
import { OrderModel } from "@/models";
import { validatePayment } from "@/server/adapters/payments/sslcommerz";
import { markOrderPaid, markPaymentFailed } from "./order";

export async function confirmSslPayment(params: { tran_id?: string | null; val_id?: string | null; amount?: string | null }) {
  const v = await validatePayment(params);
  if (!v.valid) return { ok: false as const, orderNo: params.tran_id ?? null, reason: v.reason };
  const order = await OrderModel.findOne({ orderNo: v.tranId }).select("total paymentStatus paymentMethod").lean();
  if (!order) return { ok: false as const, orderNo: v.tranId, reason: "Order not found." };
  if (order.paymentStatus === "paid") return { ok: true as const, orderNo: v.tranId, newlyPaid: false };
  if (Math.round(v.amount) !== order.total) {
    await markPaymentFailed(v.tranId, `Amount mismatch: paid ৳${v.amount}, expected ৳${order.total}`);
    return { ok: false as const, orderNo: v.tranId, reason: "Amount mismatch." };
  }
  const paid = await markOrderPaid(v.tranId, { gatewayTranId: v.bankTranId ?? v.tranId, valId: v.valId, verifiedAt: new Date() }, `Paid online via SSLCommerz${v.cardType ? ` (${v.cardType})` : ""}`);
  // Success redirect and IPN can both arrive: only the call that marked it paid sends the notification.
  return { ok: true as const, orderNo: v.tranId, newlyPaid: Boolean(paid) };
}

export async function failSslPayment(orderNo: string | null, reason: string) {
  if (orderNo) await markPaymentFailed(orderNo, reason);
}
