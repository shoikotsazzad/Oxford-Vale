import type { NextRequest } from "next/server";
import { adminFromRequest } from "@/server/admin/guard";
import { connectDB } from "@/server/db";
import { leadFilter, listLeads } from "@/server/services/admin-customers";
import { csvResponse, toCsv } from "@/lib/csv";

export async function GET(request: NextRequest) {
  if (!(await adminFromRequest("customers"))) return new Response("Not allowed", { status: 403 });
  await connectDB();
  const sp = request.nextUrl.searchParams;
  const { rows } = await listLeads(leadFilter({ q: sp.get("q") ?? undefined, status: sp.get("status") ?? undefined }), { limit: 10_000 });
  const csv = toCsv(
    ["Name", "Phone", "Email", "Status", "Source", "Cart value", "Items", "Last active", "Abandoned at", "Order"],
    rows.map((l) => [
      l.name, l.phone, l.email, l.status, l.source, l.cartValue,
      l.cartSnapshot.map((i) => `${i.qty}× ${i.name} (${i.size})`).join("; "),
      l.lastActivityAt, l.abandonedAt, l.order?.orderNo,
    ]),
  );
  return csvResponse(`leads-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
