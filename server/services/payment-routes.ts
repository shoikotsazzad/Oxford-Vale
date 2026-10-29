// Route handlers shared by Stripe, PayPal and the mock gateway: the shopper comes back from the provider here.
import "server-only";
import { after } from "next/server";
import type { NextRequest } from "next/server";
import { connectDB } from "@/server/db";
import { notifyOnlinePaid, notifyOrderPlaced } from "@/server/notifications";
import { confirmMock, type Confirmation } from "@/server/adapters/payments";
import { verifySignature } from "@/server/crypto";
import type { PaymentMethod } from "@/models";
import { applyPayment, failPayment } from "./payment-callbacks";
import { orderUrl, payUrl, redirect303 } from "./payment-redirect";

/** After the provider's page: confirm, then send the shopper to their order (paid) or back to the pay page. */
export async function handleReturn(method: PaymentMethod, request: NextRequest, confirm: () => Promise<Confirmation>) {
  await connectDB();
  const sp = request.nextUrl.searchParams;
  let c: Confirmation;
  try {
    c = sp.get("mock") ? confirmMock(method, sp.get("order") ?? "", Number(sp.get("amount")), sp.get("sig")) : await confirm();
  } catch (err) {
    console.error(`${method} return failed`, err);
    c = { ok: false, orderNo: sp.get("order"), reason: "Could not confirm the payment." };
  }
  const res = await applyPayment(method, c);
  if (!res.orderNo) return redirect303("/");
  if (res.ok) {
    if (res.newlyPaid) after(() => notifyOnlinePaid(res.orderNo));
    return redirect303(orderUrl(res.orderNo, "&paid=1"));
  }
  // Klarna and some bank methods confirm later: the webhook marks the order paid when they do.
  if (res.pending) return redirect303(orderUrl(res.orderNo, "&processing=1"));
  await failPayment(res.orderNo, `${method === "stripe" ? "Card" : "PayPal"} payment not completed: ${res.reason}`);
  after(() => notifyOrderPlaced(res.orderNo!)); // "order received" (unpaid) with a link to finish paying
  return redirect303(payUrl(res.orderNo, "&status=failed"));
}

/** The shopper cancelled on the provider's page (or chose "simulate failure" on the mock page). */
export async function handleCancel(method: PaymentMethod, request: NextRequest) {
  await connectDB();
  const sp = request.nextUrl.searchParams;
  const orderNo = sp.get("order") ?? "";
  if (!verifySignature(`cancel:${method}:${orderNo}`, sp.get("sig"))) return redirect303("/");
  const failed = sp.get("failed") === "1";
  await failPayment(orderNo, failed ? "Payment declined (test)" : "Payment cancelled by customer");
  after(() => notifyOrderPlaced(orderNo));
  return redirect303(payUrl(orderNo, `&status=${failed ? "failed" : "cancelled"}`));
}
