// Server-to-server notification from SSLCommerz. Validated with the validation API before anything changes.
import { after } from "next/server";
import { connectDB } from "@/server/db";
import { notifyOnlinePaid } from "@/server/notifications";
import { confirmSslPayment } from "@/server/services/payment-callbacks";
import { formParams } from "@/server/services/payment-redirect";

export async function POST(request: Request) {
  await connectDB();
  const p = await formParams(request);
  if (p.status && !["VALID", "VALIDATED"].includes(p.status)) return Response.json({ ok: true, data: { ignored: p.status } });
  const res = await confirmSslPayment(p);
  if (res.ok && res.newlyPaid) after(() => notifyOnlinePaid(res.orderNo));
  return Response.json(res.ok ? { ok: true, data: { orderNo: res.orderNo } } : { ok: false, error: { code: "VALIDATION", message: res.reason } }, { status: res.ok ? 200 : 400 });
}
