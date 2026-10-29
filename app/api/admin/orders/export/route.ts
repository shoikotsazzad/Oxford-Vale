import type { NextRequest } from "next/server";
import { adminFromRequest } from "@/server/admin/guard";
import { connectDB } from "@/server/db";
import { OrderModel } from "@/models";
import { orderFilter, pickOrderParams } from "@/server/services/admin-orders";
import { csvResponse, toCsv } from "@/lib/csv";
import { toDollars } from "@/lib/money";

const MAX_ROWS = 10_000;

export async function GET(request: NextRequest) {
  if (!(await adminFromRequest("orders"))) return new Response("Not allowed", { status: 403 });
  await connectDB();
  const filter = orderFilter(pickOrderParams(Object.fromEntries(request.nextUrl.searchParams)));
  const orders = await OrderModel.find(filter).sort({ createdAt: -1 }).limit(MAX_ROWS).lean();
  const csv = toCsv(
    ["Order no", "Date", "Customer", "Phone", "Email", "Town/City", "Postcode", "Country", "Items", "Subtotal (USD)", "Discount (USD)", "Coupon", "Delivery (USD)", "Total (USD)", "Payment method", "Payment status", "Payment ref", "Status", "Courier", "Tracking no"],
    orders.map((o) => [
      o.orderNo, o.createdAt, o.customer?.name, o.customer?.phone, o.customer?.email, o.shippingAddress?.city, o.shippingAddress?.postcode, o.shippingAddress?.country,
      o.items.map((i) => `${i.qty}× ${i.sku}`).join("; "), toDollars(o.subtotal), toDollars(o.discount ?? 0), o.couponCode, toDollars(o.delivery?.fee ?? 0), toDollars(o.total),
      o.paymentMethod, o.paymentStatus, o.payment?.gatewayTranId, o.status, o.shipment?.courier, o.shipment?.trackingNo,
    ]),
  );
  return csvResponse(`orders-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
