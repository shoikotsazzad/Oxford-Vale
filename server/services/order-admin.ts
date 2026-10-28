// Admin order lifecycle: status machine, payment verification, notes. Pure DB logic, no auth (callers check roles).
import { OrderModel, type OrderStatus } from "@/models";
import { cancelOrder, markOrderPaid, OrderError } from "./order";
import { restoreOrderStock } from "./stock";
import { releaseCoupon } from "./coupon";
import { syncProductSummary } from "./catalog-sync";

/** Allowed next statuses. Cancel restores stock; Returned may restock; Refunded needs a paid order. */
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  returned: ["refunded"],
  cancelled: ["refunded"],
  refunded: [],
};

export type Actor = { id: string; name: string };
export type TransitionInput = { to: OrderStatus; note?: string; restock?: boolean; courier?: string; trackingNo?: string };

const syncItems = (items: { product: unknown }[]) =>
  Promise.all([...new Set(items.map((i) => String(i.product)))].map((id) => syncProductSummary(id)));

export async function transitionOrder(orderNo: string, input: TransitionInput, actor: Actor) {
  const order = await OrderModel.findOne({ orderNo }).lean();
  if (!order) throw new OrderError("NOT_FOUND", "Order not found.");
  const from = order.status;
  if (!TRANSITIONS[from].includes(input.to)) throw new OrderError("CONFLICT", `An order that is ${from} can't be moved to ${input.to}.`);
  if (input.to === "refunded" && order.paymentStatus !== "paid") throw new OrderError("CONFLICT", "Only paid orders can be refunded.");
  if (input.to === "shipped" && !input.courier?.trim()) throw new OrderError("VALIDATION", "Add the courier before marking as shipped.", { courier: "Required when shipping." });

  const note = input.note?.trim() || undefined;
  if (input.to === "cancelled" && from === "pending") {
    await cancelOrder(orderNo, "admin", note ?? `Cancelled by ${actor.name}`);
    return { from, to: input.to, stockRestored: true };
  }

  const set: Record<string, unknown> = { status: input.to };
  if (input.to === "cancelled") set.cancelledBy = "admin";
  if (input.to === "shipped") set.shipment = { courier: input.courier!.trim(), trackingNo: input.trackingNo?.trim() ?? "" };
  if (input.to === "delivered" && order.paymentMethod === "cod" && order.paymentStatus !== "paid") set.paymentStatus = "paid"; // cash collected
  if (input.to === "refunded") set.paymentStatus = "refunded";

  // Conditional on the status we read, so two admins can't apply conflicting changes.
  const updated = await OrderModel.findOneAndUpdate(
    { orderNo, status: from },
    { ...set, $push: { statusHistory: { status: input.to, at: new Date(), by: actor.id, note } } },
    { returnDocument: "after" },
  ).lean();
  if (!updated) throw new OrderError("CONFLICT", "This order was just changed by someone else. Reload and try again.");

  let stockRestored = false;
  if (input.to === "cancelled" || (input.to === "returned" && input.restock)) {
    stockRestored = await restoreOrderStock(updated._id);
    if (stockRestored) await syncItems(updated.items);
  }
  if (input.to === "cancelled" && updated.couponCode) await releaseCoupon(updated.couponCode);
  return { from, to: input.to, stockRestored };
}

/** Admin confirms a bKash/Nagad transaction: order → paid + confirmed. */
export async function verifyManualPayment(orderNo: string, actor: Actor) {
  const order = await OrderModel.findOne({ orderNo }).select("paymentMethod paymentStatus payment status").lean();
  if (!order) throw new OrderError("NOT_FOUND", "Order not found.");
  if (!["bkash", "nagad"].includes(order.paymentMethod)) throw new OrderError("CONFLICT", "Only bKash and Nagad payments are verified by hand.");
  if (!order.payment?.trxId) throw new OrderError("CONFLICT", "The customer hasn't submitted a transaction ID yet.");
  const label = order.paymentMethod === "bkash" ? "bKash" : "Nagad";
  const note = `${label} payment ${order.payment.trxId} verified by ${actor.name}`;
  const paid =
    order.status === "pending"
      ? await markOrderPaid(orderNo, { verifiedBy: actor.id, verifiedAt: new Date() }, note, actor.id)
      : // Already moved on (e.g. confirmed by phone): record the payment without touching the status.
        await OrderModel.findOneAndUpdate(
          { orderNo, paymentStatus: { $ne: "paid" }, status: { $nin: ["cancelled", "refunded"] } },
          { paymentStatus: "paid", "payment.verifiedBy": actor.id, "payment.verifiedAt": new Date(), $push: { statusHistory: { status: order.status, at: new Date(), by: actor.id, note } } },
          { returnDocument: "after" },
        ).lean();
  if (!paid) throw new OrderError("CONFLICT", "This order is already paid or was cancelled.");
  return paid;
}

/** Transaction not found in the merchant account: clear it so the customer can submit again. */
export async function rejectManualPayment(orderNo: string, reason: string, actor: Actor) {
  const res = await OrderModel.findOneAndUpdate(
    { orderNo, paymentMethod: { $in: ["bkash", "nagad"] }, paymentStatus: { $ne: "paid" }, "payment.trxId": { $exists: true }, status: { $nin: ["cancelled", "returned", "refunded"] } },
    {
      paymentStatus: "failed",
      $unset: { "payment.trxId": 1, "payment.senderNumber": 1, "payment.submittedAt": 1 },
      $push: { statusHistory: { status: "pending", at: new Date(), by: actor.id, note: `Payment not verified: ${reason}` } },
    },
    { returnDocument: "before" },
  ).lean();
  if (!res) throw new OrderError("CONFLICT", "There's no submitted payment to reject on this order.");
  return res;
}

export async function addInternalNote(orderNo: string, text: string, actor: Actor) {
  const res = await OrderModel.updateOne({ orderNo }, { $push: { internalNotes: { text, by: actor.id, byName: actor.name, at: new Date() } } });
  if (!res.matchedCount) throw new OrderError("NOT_FOUND", "Order not found.");
}
