// PayPal Orders v2 over the REST API (no SDK). The shopper approves on PayPal; we capture on return and only
// mark the order paid when the capture is COMPLETED for the full amount. Docs: https://developer.paypal.com/docs/api/orders/v2/
import type { Confirmation, GatewayOrder, Mode } from "./types";
import { baseUrl } from "./base";
import { sign } from "@/server/crypto";

const creds = () => ({ id: process.env.PAYPAL_CLIENT_ID ?? "", secret: process.env.PAYPAL_CLIENT_SECRET ?? "" });
export const mode = (): Mode => (!creds().id || !creds().secret ? "mock" : process.env.PAYPAL_MODE === "live" ? "live" : "test");
const host = () => (mode() === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com");

async function token() {
  const { id, secret } = creds();
  const res = await fetch(`${host()}/v1/oauth2/token`, {
    method: "POST",
    headers: { authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`, "content-type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const json = (await res.json()) as { access_token?: string; error_description?: string };
  if (!json.access_token) throw new Error(`PayPal auth failed: ${json.error_description ?? res.status}`);
  return json.access_token;
}

async function api<T>(path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
  const res = await fetch(`${host()}${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${await token()}`, "content-type": "application/json", ...(idempotencyKey && { "PayPal-Request-Id": idempotencyKey }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await res.json()) as T & { message?: string; details?: { issue?: string }[] };
  if (!res.ok) {
    const issue = json.details?.[0]?.issue;
    if (issue === "ORDER_ALREADY_CAPTURED") return json; // a second return after a successful capture
    throw new Error(`PayPal ${path}: ${issue ?? json.message ?? res.status}`);
  }
  return json;
}

export const cancelUrl = (orderNo: string) => `${baseUrl()}/api/payments/paypal/cancel?order=${orderNo}&sig=${sign(`cancel:paypal:${orderNo}`)}`;

export async function createOrder(order: GatewayOrder) {
  const o = await api<{ id: string; links: { rel: string; href: string }[] }>(
    "/v2/checkout/orders",
    {
      intent: "CAPTURE",
      purchase_units: [{ reference_id: order.orderNo, custom_id: order.orderNo, description: `Oxford Vale order ${order.orderNo}`, amount: { currency_code: "USD", value: (order.total / 100).toFixed(2) } }],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "Oxford Vale",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING", // the delivery address is the one entered at checkout
            return_url: `${baseUrl()}/api/payments/paypal/return`,
            cancel_url: cancelUrl(order.orderNo),
          },
        },
      },
    },
    `create-${order.orderNo}-${Date.now()}`,
  );
  const approve = o.links.find((l) => l.rel === "payer-action" || l.rel === "approve");
  if (!approve) throw new Error("PayPal returned no approval link.");
  return { url: approve.href, sessionId: o.id };
}

type Capture = {
  id: string;
  status: string;
  purchase_units?: { reference_id?: string; payments?: { captures?: { id: string; status: string; custom_id?: string; amount: { currency_code: string; value: string } }[] } }[];
};

/** Capture the approved PayPal order (idempotent per PayPal order id). */
export async function captureOrder(paypalOrderId: string): Promise<Confirmation> {
  if (!/^[A-Z0-9]{10,30}$/.test(paypalOrderId)) return { ok: false, orderNo: null, reason: "Invalid PayPal order." };
  const c = await api<Capture>(`/v2/checkout/orders/${paypalOrderId}/capture`, {}, `capture-${paypalOrderId}`);
  const unit = c.purchase_units?.[0];
  const cap = unit?.payments?.captures?.[0];
  const orderNo = cap?.custom_id ?? unit?.reference_id ?? null;
  if (!cap || cap.status !== "COMPLETED") return { ok: false, orderNo, reason: `PayPal capture ${cap?.status ?? c.status}`, pending: cap?.status === "PENDING" };
  return { ok: true, orderNo: orderNo!, amount: Math.round(Number(cap.amount.value) * 100), currency: cap.amount.currency_code, sessionId: paypalOrderId, gatewayTranId: cap.id, brand: "PayPal" };
}
