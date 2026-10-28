import { adminFromRequest } from "@/server/admin/guard";
import { connectDB } from "@/server/db";
import { OrderModel } from "@/models";
import { getSettings } from "@/server/services/settings";
import { renderInvoice } from "@/server/invoice";

export async function GET(_request: Request, ctx: RouteContext<"/api/admin/orders/[orderNo]/invoice">) {
  if (!(await adminFromRequest("orders"))) return new Response("Not allowed", { status: 403 });
  const { orderNo } = await ctx.params;
  await connectDB();
  const order = await OrderModel.findOne({ orderNo }).lean();
  if (!order) return new Response("Order not found", { status: 404 });
  const pdf = await renderInvoice(order, await getSettings());
  return new Response(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="invoice-${order.orderNo}.pdf"`, "Cache-Control": "no-store" },
  });
}
