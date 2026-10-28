import { after } from "next/server";
import { connectDB } from "@/server/db";
import { notifyOrderPlaced } from "@/server/notifications";
import { failSslPayment } from "@/server/services/payment-callbacks";
import { formParams, payUrl, redirect303 } from "@/server/services/payment-redirect";

export async function POST(request: Request) {
  await connectDB();
  const p = await formParams(request);
  if (!p.tran_id) return redirect303("/");
  await failSslPayment(p.tran_id, "Payment cancelled by customer");
  // Card orders send "order received" only once the gateway answers; unpaid, it explains how to retry or pay on delivery.
  after(() => notifyOrderPlaced(p.tran_id));
  return redirect303(payUrl(p.tran_id, "&status=cancelled"));
}
