"use server";
import { after } from "next/server";
import { notifyOrderShipped, notifyPaymentReceived } from "@/server/notifications";
import { adminAction } from "@/server/admin/guard";
import { revalidateStore } from "@/server/admin/revalidate";
import { audit } from "@/server/services/audit";
import { addInternalNote, rejectManualPayment, transitionOrder, verifyManualPayment } from "@/server/services/order-admin";
import { cleanText } from "@/server/sanitize";
import { ok } from "@/server/result";
import { orderNoteSchema, orderRefSchema, orderStatusSchema, rejectPaymentSchema } from "@/lib/validation/admin";

const entity = (orderNo: string) => ({ type: "order", id: orderNo, label: orderNo });

export async function changeOrderStatus(input: unknown) {
  return adminAction("orders", orderStatusSchema, input, async (d, admin) => {
    const res = await transitionOrder(
      d.orderNo,
      { to: d.to, note: d.note && cleanText(d.note), restock: d.restock, courier: d.courier && cleanText(d.courier), trackingNo: d.trackingNo && cleanText(d.trackingNo) },
      admin,
    );
    await audit(admin, "order.status.update", entity(d.orderNo), {
      status: { from: res.from, to: res.to },
      ...(res.stockRestored && { stock: { from: "reserved", to: "restored" } }),
    });
    if (res.to === "shipped") after(() => notifyOrderShipped(d.orderNo));
    revalidateStore(...(res.stockRestored ? (["catalog"] as const) : []));
    return ok(res);
  });
}

export async function verifyPayment(input: unknown) {
  return adminAction("orders", orderRefSchema, input, async (d, admin) => {
    const order = await verifyManualPayment(d.orderNo, admin);
    after(() => notifyPaymentReceived(d.orderNo));
    await audit(admin, "order.payment.verify", entity(d.orderNo), { paymentStatus: { from: "unpaid", to: "paid" }, trxId: { from: null, to: order.payment?.trxId } });
    revalidateStore();
    return ok(null);
  });
}

export async function rejectPayment(input: unknown) {
  return adminAction("orders", rejectPaymentSchema, input, async (d, admin) => {
    const before = await rejectManualPayment(d.orderNo, cleanText(d.reason), admin);
    await audit(admin, "order.payment.reject", entity(d.orderNo), { trxId: { from: before.payment?.trxId, to: null }, reason: { from: null, to: d.reason } });
    revalidateStore();
    return ok(null);
  });
}

export async function addOrderNote(input: unknown) {
  return adminAction("orders", orderNoteSchema, input, async (d, admin) => {
    await addInternalNote(d.orderNo, cleanText(d.text, { multiline: true }), admin);
    await audit(admin, "order.note.add", entity(d.orderNo));
    revalidateStore();
    return ok(null);
  });
}
