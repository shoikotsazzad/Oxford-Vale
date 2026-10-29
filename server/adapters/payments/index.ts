// Online payments: Stripe Checkout (cards, Amex, Apple Pay, Google Pay, Klarna) and PayPal.
// Each provider runs in "mock" mode until its keys are set (a built-in test page, no account needed),
// then in test/sandbox or live mode. Payments are always confirmed server-side before an order is marked paid.
import type { PaymentMethod } from "@/models/enums";
import { sign, verifySignature } from "@/server/crypto";
import * as stripe from "./stripe";
import * as paypal from "./paypal";
import { baseUrl } from "./base";
import type { Confirmation, GatewayOrder, Mode } from "./types";

export type { Confirmation, GatewayOrder, Mode };
export { baseUrl };

export const paymentMode = (method: PaymentMethod): Mode => (method === "stripe" ? stripe.mode() : paypal.mode());

/** Start a payment; returns the URL to send the shopper to and the provider's session/order id. */
export async function startPayment(method: PaymentMethod, order: GatewayOrder): Promise<{ url: string; sessionId: string }> {
  if (paymentMode(method) === "mock") {
    const q = new URLSearchParams({ provider: method, order: order.orderNo, amount: String(order.total), sig: mockSig("start", method, order.orderNo, order.total) });
    return { url: `${baseUrl()}/api/payments/mock?${q}`, sessionId: `mock_${order.orderNo}` };
  }
  return method === "stripe" ? stripe.createSession(order) : paypal.createOrder(order);
}

// Mock links are signed so nobody can mark an order paid by editing a URL.
export const mockSig = (step: "start" | "paid", method: string, orderNo: string, amount: number) => sign(`mock:${step}:${method}:${orderNo}:${amount}`);
export const verifyMockSig = (step: "start" | "paid", method: string, orderNo: string, amount: number, sig: string | null) =>
  verifySignature(`mock:${step}:${method}:${orderNo}:${amount}`, sig);

/** Mock "Pay" button result. */
export function confirmMock(method: PaymentMethod, orderNo: string, amount: number, sig: string | null): Confirmation {
  if (paymentMode(method) !== "mock") return { ok: false, orderNo, reason: "Mock payments are off." };
  if (!verifyMockSig("paid", method, orderNo, amount, sig)) return { ok: false, orderNo, reason: "Invalid mock signature." };
  return { ok: true, orderNo, amount, currency: "USD", sessionId: `mock_${orderNo}`, gatewayTranId: `mock_${method}_${orderNo}`, brand: method === "stripe" ? "Mock card" : "Mock PayPal" };
}

export { stripe, paypal };
