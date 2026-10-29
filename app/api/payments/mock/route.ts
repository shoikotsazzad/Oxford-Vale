// Mock mode (no Stripe / PayPal keys yet): a stand-in for the provider's hosted page, so the whole payment flow works.
import type { NextRequest } from "next/server";
import { mockSig, paymentMode, verifyMockSig } from "@/server/adapters/payments";
import { stripe, paypal } from "@/server/adapters/payments";
import { formatMoneyExact } from "@/lib/money";
import { PAYMENT_METHODS, type PaymentMethod } from "@/models/enums";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const method = sp.get("provider") as PaymentMethod;
  if (!PAYMENT_METHODS.includes(method) || paymentMode(method) !== "mock") return new Response("Not found", { status: 404 });
  const orderNo = sp.get("order") ?? "";
  const amount = Number(sp.get("amount"));
  if (!verifyMockSig("start", method, orderNo, amount, sp.get("sig"))) return new Response("Invalid payment link", { status: 400 });

  const ret = `/api/payments/${method}/return?${new URLSearchParams({ mock: "1", order: orderNo, amount: String(amount), sig: mockSig("paid", method, orderNo, amount) })}`;
  const cancel = method === "stripe" ? stripe.cancelUrl(orderNo) : paypal.cancelUrl(orderNo);
  const name = method === "stripe" ? "Stripe Checkout" : "PayPal";
  const ways = method === "stripe" ? "Card · Amex · Apple Pay · Google Pay · Klarna" : "PayPal balance or linked card";

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} (test mode)</title>
<style>
  :root{color-scheme:light dark}
  body{margin:0;font-family:system-ui,sans-serif;background:#eef1f5;color:#1d2733;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px}
  .card{background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.08);max-width:380px;width:100%;padding:28px}
  .badge{display:inline-block;background:#fff4d6;color:#6b4c00;font-size:12px;padding:4px 8px;border-radius:6px}
  h1{font-size:20px;margin:14px 0 4px} .muted{color:#5c6773;font-size:14px} .amount{font-size:32px;font-weight:700;margin:18px 0}
  a.btn{display:flex;align-items:center;justify-content:center;min-height:46px;border-radius:8px;border:1px solid #c9d2dc;background:#fff;color:inherit;font-size:15px;margin-top:10px;text-decoration:none}
  a.primary{background:${method === "stripe" ? "#635bff" : "#0070ba"};border-color:transparent;color:#fff;font-weight:600}
  @media (prefers-color-scheme:dark){body{background:#0f1216;color:#e6e9ee}.card{background:#181c22}a.btn{background:#181c22;border-color:#333b45}.muted{color:#a2adb9}}
</style></head><body><main class="card">
  <span class="badge">TEST MODE · no real money</span>
  <h1>${name}</h1>
  <p class="muted">Oxford Vale · Order ${esc(orderNo)}<br>${ways}</p>
  <p class="amount">${formatMoneyExact(amount)}</p>
  <a class="btn primary" href="${esc(ret)}">Pay now (simulate success)</a>
  <a class="btn" href="${esc(cancel)}&failed=1">Simulate declined payment</a>
  <a class="btn" href="${esc(cancel)}">Cancel and go back</a>
  <p class="muted" style="margin-top:18px">Add ${method === "stripe" ? "STRIPE_SECRET_KEY (sk_test_…)" : "PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET"} to .env.local to use the real ${method === "stripe" ? "Stripe test mode" : "PayPal sandbox"}.</p>
</main></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
