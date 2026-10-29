import type { NextRequest } from "next/server";
import { stripe } from "@/server/adapters/payments";
import { handleReturn } from "@/server/services/payment-routes";

export function GET(request: NextRequest) {
  return handleReturn("stripe", request, () => stripe.confirmSession(request.nextUrl.searchParams.get("session_id") ?? ""));
}
