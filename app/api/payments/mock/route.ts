// SSLCOMMERZ_MODE=mock: a stand-in for the SSLCommerz hosted page, so the online-payment flow works without an account.
import type { NextRequest } from "next/server";
import { mockValId, sslMode, verifyMockLink } from "@/server/adapters/payments/sslcommerz";
import { formatBDT } from "@/lib/money";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function GET(request: NextRequest) {
  if (sslMode() !== "mock") return new Response("Not found", { status: 404 });
  const sp = request.nextUrl.searchParams;
  const tranId = sp.get("tran_id") ?? "";
  const amount = Number(sp.get("amount"));
  if (!verifyMockLink(tranId, amount, sp.get("sig"))) return new Response("Invalid payment link", { status: 400 });

  const form = (action: string, label: string, primary = false, extra = "") => `
    <form method="post" action="/api/payments/sslcommerz/${action}">
      <input type="hidden" name="tran_id" value="${esc(tranId)}">
      <input type="hidden" name="amount" value="${amount}">${extra}
      <button class="${primary ? "primary" : ""}">${label}</button>
    </form>`;

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mock payment gateway</title>
<style>
  body{margin:0;font-family:system-ui,sans-serif;background:#eef2f6;color:#1d2733;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px}
  .card{background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.08);max-width:380px;width:100%;padding:28px}
  .badge{display:inline-block;background:#fff4d6;color:#7a5600;font-size:12px;padding:4px 8px;border-radius:6px}
  h1{font-size:20px;margin:14px 0 4px} .muted{color:#66727f;font-size:14px} .amount{font-size:32px;font-weight:700;margin:18px 0}
  form{margin:0} button{width:100%;min-height:46px;border-radius:8px;border:1px solid #c9d2dc;background:#fff;font-size:15px;margin-top:10px;cursor:pointer}
  button.primary{background:#0a7d3e;border-color:#0a7d3e;color:#fff;font-weight:600}
</style></head><body><main class="card">
  <span class="badge">TEST MODE · no real money</span>
  <h1>SSLCommerz (mock)</h1>
  <p class="muted">Oxford Vale · Order ${esc(tranId)}</p>
  <p class="amount">${formatBDT(amount)}</p>
  ${form("success", "Pay now (simulate success)", true, `<input type="hidden" name="val_id" value="${mockValId(tranId, amount)}">`)}
  ${form("fail", "Simulate failed payment")}
  ${form("cancel", "Cancel and go back")}
  <p class="muted" style="margin-top:18px">Set SSLCOMMERZ_MODE=sandbox with a free developer store to use the real sandbox.</p>
</main></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
