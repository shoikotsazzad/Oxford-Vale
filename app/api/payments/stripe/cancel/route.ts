import type { NextRequest } from "next/server";
import { handleCancel } from "@/server/services/payment-routes";

export function GET(request: NextRequest) {
  return handleCancel("stripe", request);
}
