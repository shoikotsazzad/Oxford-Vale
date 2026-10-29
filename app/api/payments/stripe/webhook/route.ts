// Stripe webhook: the reliable path for payments that confirm after the redirect (Klarna, some wallets) or when the
// shopper closes the tab. Endpoint: /api/payments/stripe/webhook, events checkout.session.completed,
// checkout.session.async_payment_succeeded and checkout.session.async_payment_failed.
import { after } from "next/server";
import { connectDB } from "@/server/db";
import { stripe } from "@/server/adapters/payments";
import { notifyOnlinePaid } from "@/server/notifications";
import { applyPayment, failPayment } from "@/server/services/payment-callbacks";

export async function POST(request: Request) {
  const raw = await request.text();
  if (!stripe.verifyWebhook(raw, request.headers.get("stripe-signature"))) return Response.json({ ok: false }, { status: 400 });
  const event = JSON.parse(raw) as { type: string; data: { object: { id: string; client_reference_id?: string | null } } };
  await connectDB();
  const session = event.data.object;
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const res = await applyPayment("stripe", await stripe.confirmSession(session.id));
    if (res.ok && res.newlyPaid) after(() => notifyOnlinePaid(res.orderNo));
  } else if (event.type === "checkout.session.async_payment_failed") {
    await failPayment(session.client_reference_id ?? null, "Delayed payment failed (Stripe)");
  }
  return Response.json({ ok: true });
}
