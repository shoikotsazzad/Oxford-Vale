import { after } from "next/server";
import { connectDB } from "@/server/db";
import { notifyOnlinePaid } from "@/server/notifications";
import { confirmSslPayment } from "@/server/services/payment-callbacks";
import { formParams, orderUrl, payUrl, redirect303 } from "@/server/services/payment-redirect";

export async function POST(request: Request) {
  await connectDB();
  const p = await formParams(request);
  const res = await confirmSslPayment(p);
  if (res.ok && res.newlyPaid) after(() => notifyOnlinePaid(res.orderNo));
  if (!res.orderNo) return redirect303("/");
  return redirect303(res.ok ? orderUrl(res.orderNo, "&paid=1") : payUrl(res.orderNo, "&status=failed"));
}
