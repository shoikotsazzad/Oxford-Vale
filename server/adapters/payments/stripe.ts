// Stripe Checkout over the REST API (no SDK). Payment methods (cards, Apple Pay, Google Pay, Klarna) are the ones
// switched on in the Stripe dashboard. Docs: https://docs.stripe.com/api/checkout/sessions
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Confirmation, GatewayOrder, Mode } from "./types";
import { baseUrl } from "./base";
import { sign } from "@/server/crypto";

const key = () => process.env.STRIPE_SECRET_KEY ?? "";
export const mode = (): Mode => (!key() ? "mock" : key().startsWith("sk_live_") ? "live" : "test");

async function api<T>(path: string, init: { method?: "GET" | "POST"; body?: URLSearchParams } = {}): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: init.method ?? "GET",
    headers: { authorization: `Bearer ${key()}`, ...(init.body && { "content-type": "application/x-www-form-urlencoded" }) },
    body: init.body,
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Stripe ${path}: ${json.error?.message ?? res.status}`);
  return json;
}

/** Signed link back to the pay page if the shopper cancels on Stripe. */
export const cancelUrl = (orderNo: string) => `${baseUrl()}/api/payments/stripe/cancel?order=${orderNo}&sig=${sign(`cancel:stripe:${orderNo}`)}`;

export async function createSession(order: GatewayOrder) {
  // One line for the whole order: discounts and delivery are already in the total the customer agreed to.
  const body = new URLSearchParams({
    mode: "payment",
    client_reference_id: order.orderNo,
    "metadata[orderNo]": order.orderNo,
    "payment_intent_data[metadata][orderNo]": order.orderNo,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(order.total),
    "line_items[0][price_data][product_data][name]": `Oxford Vale order ${order.orderNo}`,
    success_url: `${baseUrl()}/api/payments/stripe/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl(order.orderNo),
    ...(order.email && { customer_email: order.email }),
  });
  const s = await api<{ id: string; url: string }>("checkout/sessions", { method: "POST", body });
  return { url: s.url, sessionId: s.id };
}

type Session = {
  id: string;
  client_reference_id: string | null;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  status: "open" | "complete" | "expired";
  amount_total: number;
  currency: string;
  payment_intent: string | { id: string; payment_method?: { type?: string; card?: { brand?: string } } } | null;
};

/** Look the session up at Stripe: never trust the browser redirect alone. */
export async function confirmSession(sessionId: string): Promise<Confirmation> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return { ok: false, orderNo: null, reason: "Invalid session." };
  const s = await api<Session>(`checkout/sessions/${sessionId}?expand[]=payment_intent.payment_method`);
  const orderNo = s.client_reference_id;
  if (!orderNo) return { ok: false, orderNo: null, reason: "Session has no order." };
  // Klarna and some wallets confirm a little later: the webhook finishes those.
  if (s.payment_status !== "paid") return { ok: false, orderNo, reason: `Payment ${s.payment_status}`, pending: s.status === "complete" };
  const pi = typeof s.payment_intent === "object" ? s.payment_intent : null;
  const method = pi?.payment_method;
  const brand = method?.card?.brand ? `card (${method.card.brand})` : (method?.type ?? "card");
  return { ok: true, orderNo, amount: s.amount_total, currency: s.currency.toUpperCase(), sessionId: s.id, gatewayTranId: pi?.id ?? (s.payment_intent as string) ?? s.id, brand };
}

/** Verify the Stripe-Signature header (HMAC-SHA256 of "timestamp.body", 5-minute tolerance). */
export function verifyWebhook(rawBody: string, header: string | null, now = Date.now()) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(now / 1000 - t) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest();
  return header
    .split(",")
    .filter((p) => p.startsWith("v1="))
    .some((p) => {
      const got = Buffer.from(p.slice(3), "hex");
      return got.length === expected.length && timingSafeEqual(got, expected);
    });
}
