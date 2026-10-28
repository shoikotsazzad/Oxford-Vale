// SSLCommerz adapter. SSLCOMMERZ_MODE: mock (default, built-in fake gateway) | sandbox | live.
// Docs: https://developer.sslcommerz.com/doc/v4/
import { sign, verifySignature } from "@/server/crypto";
import { site } from "@/data/site";

export type GatewayOrder = {
  orderNo: string;
  total: number;
  customer: { name: string; email: string; phone: string };
  address: { addressLine: string; upazila: string; district: string; division: string };
  itemCount: number;
  productNames: string;
};

export type Validation = { valid: true; tranId: string; valId: string; amount: number; bankTranId?: string; cardType?: string } | { valid: false; reason: string };

export const sslMode = () => (["sandbox", "live"].includes(process.env.SSLCOMMERZ_MODE ?? "") ? (process.env.SSLCOMMERZ_MODE as "sandbox" | "live") : "mock");
const host = () => (sslMode() === "live" ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com");
const baseUrl = () => process.env.APP_URL || site.url;

function credentials() {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePass = process.env.SSLCOMMERZ_STORE_PASSWORD;
  if (!storeId || !storePass) throw new Error("Set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD, or use SSLCOMMERZ_MODE=mock.");
  return { storeId, storePass };
}

/** Start a payment session; returns the URL to send the shopper to. */
export async function initPayment(order: GatewayOrder): Promise<string> {
  if (sslMode() === "mock") {
    const q = new URLSearchParams({ tran_id: order.orderNo, amount: String(order.total), sig: sign(`mock:${order.orderNo}:${order.total}`) });
    return `${baseUrl()}/api/payments/mock?${q}`;
  }
  const { storeId, storePass } = credentials();
  const cb = (s: string) => `${baseUrl()}/api/payments/sslcommerz/${s}`;
  const body = new URLSearchParams({
    store_id: storeId, store_passwd: storePass, total_amount: order.total.toFixed(2), currency: "BDT", tran_id: order.orderNo,
    success_url: cb("success"), fail_url: cb("fail"), cancel_url: cb("cancel"), ipn_url: cb("ipn"),
    cus_name: order.customer.name, cus_email: order.customer.email || "no-email@oxfordvale.example", cus_phone: order.customer.phone,
    cus_add1: order.address.addressLine, cus_city: order.address.district, cus_state: order.address.division, cus_postcode: "0000", cus_country: "Bangladesh",
    shipping_method: "Courier", num_of_item: String(order.itemCount), ship_name: order.customer.name, ship_add1: order.address.addressLine,
    ship_city: order.address.district, ship_state: order.address.division, ship_postcode: "0000", ship_country: "Bangladesh",
    product_name: order.productNames.slice(0, 250), product_category: "Clothing", product_profile: "physical-goods",
  });
  const res = await fetch(`${host()}/gwprocess/v4/api.php`, { method: "POST", body });
  const json = (await res.json()) as { status?: string; GatewayPageURL?: string; failedreason?: string };
  if (json.status !== "SUCCESS" || !json.GatewayPageURL) throw new Error(`SSLCommerz session failed: ${json.failedreason ?? res.status}`);
  return json.GatewayPageURL;
}

/** Validate a payment server-side. Never trust the browser's redirect alone. */
export async function validatePayment(params: { tran_id?: string | null; val_id?: string | null; amount?: string | null; sig?: string | null }): Promise<Validation> {
  const tranId = params.tran_id ?? "";
  const valId = params.val_id ?? "";
  if (!tranId || !valId) return { valid: false, reason: "Missing transaction details." };

  if (sslMode() === "mock") {
    const amount = Number(params.amount);
    return verifySignature(`mock-paid:${tranId}:${amount}`, valId.replace(/^mock-/, ""))
      ? { valid: true, tranId, valId, amount, cardType: "MOCK" }
      : { valid: false, reason: "Invalid mock signature." };
  }

  const { storeId, storePass } = credentials();
  const q = new URLSearchParams({ val_id: valId, store_id: storeId, store_passwd: storePass, format: "json" });
  const res = await fetch(`${host()}/validator/api/validationserverAPI.php?${q}`);
  const json = (await res.json()) as { status?: string; tran_id?: string; amount?: string; currency?: string; bank_tran_id?: string; card_type?: string };
  if (!["VALID", "VALIDATED"].includes(json.status ?? "") || json.currency !== "BDT") return { valid: false, reason: `Validation status ${json.status ?? "unknown"}` };
  return { valid: true, tranId: json.tran_id ?? "", valId, amount: Number(json.amount), bankTranId: json.bank_tran_id, cardType: json.card_type };
}

/** Mock gateway only: the signed val_id the fake "Pay" button posts back. */
export const mockValId = (tranId: string, amount: number) => `mock-${sign(`mock-paid:${tranId}:${amount}`)}`;
export const verifyMockLink = (tranId: string, amount: number, sig: string | null) => verifySignature(`mock:${tranId}:${amount}`, sig);
