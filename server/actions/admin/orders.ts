"use server";
import { after } from "next/server";
import { notifyOrderShipped } from "@/server/notifications";
import { adminAction } from "@/server/admin/guard";
import { revalidateStore } from "@/server/admin/revalidate";
import { audit } from "@/server/services/audit";
import { addInternalNote, transitionOrder } from "@/server/services/order-admin";
import { cleanText } from "@/server/sanitize";
import { ok } from "@/server/result";
import { orderNoteSchema, orderStatusSchema } from "@/lib/validation/admin";

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

export async function addOrderNote(input: unknown) {
  return adminAction("orders", orderNoteSchema, input, async (d, admin) => {
    await addInternalNote(d.orderNo, cleanText(d.text, { multiline: true }), admin);
    await audit(admin, "order.note.add", entity(d.orderNo));
    revalidateStore();
    return ok(null);
  });
}
