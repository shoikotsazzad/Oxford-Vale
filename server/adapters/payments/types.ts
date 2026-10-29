export type GatewayOrder = { orderNo: string; total: number; email: string; name: string };
export type Mode = "mock" | "test" | "live";

/** A provider's verdict on a payment, after checking with the provider server-side. */
export type Confirmation =
  | { ok: true; orderNo: string; amount: number; currency: string; sessionId: string; gatewayTranId: string; brand: string }
  | { ok: false; orderNo: string | null; reason: string; pending?: boolean };
