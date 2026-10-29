import type { NextRequest } from "next/server";
import { paypal } from "@/server/adapters/payments";
import { handleReturn } from "@/server/services/payment-routes";

// PayPal sends the shopper back with ?token=<PayPal order id>; capturing it is what takes the money.
export function GET(request: NextRequest) {
  return handleReturn("paypal", request, () => paypal.captureOrder(request.nextUrl.searchParams.get("token") ?? ""));
}
