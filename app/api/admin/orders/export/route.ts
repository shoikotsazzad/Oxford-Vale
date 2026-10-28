import type { NextRequest } from "next/server";
import { adminFromRequest } from "@/server/admin/guard";
import { connectDB } from "@/server/db";
import { OrderModel } from "@/models";
import { orderFilter, pickOrderParams } from "@/server/services/admin-orders";
import { csvResponse, toCsv } from "@/lib/csv";

const MAX_ROWS = 10_000;

export async function GET(request: NextRequest) {
  if (!(await adminFromRequest("orders"))) return new Response("Not allowed", { status: 403 });
  await connectDB();
  const filter = orderFilter(pickOrderParams(Object.fromEntries(request.nextUrl.searchParams)));
  const orders = await OrderModel.find(filter).sort({ createdAt: -1 }).limit(MAX_ROWS).lean();
  const csv = toCsv(
    ["Order no", "Date", "Customer", "Phone", "Email", "District", "Items", "Subtotal", "Discount", "Coupon", "Delivery", "Total", "Payment method", "Payment status", "Trx ID", "Status", "Courier", "Tracking no"],
    orders.map((o) => [
      o.orderNo, o.createdAt, o.customer?.name, o.customer?.phone, o.customer?.email, o.shippingAddress?.district,
      o.items.map((i) => `${i.qty}× ${i.sku}`).join("; "), o.subtotal, o.discount, o.couponCode, o.delivery?.fee, o.total,
      o.paymentMethod, o.paymentStatus, o.payment?.trxId, o.status, o.shipment?.courier, o.shipment?.trackingNo,
    ]),
  );
  return csvResponse(`orders-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
