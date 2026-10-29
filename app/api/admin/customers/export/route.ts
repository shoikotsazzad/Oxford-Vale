import type { NextRequest } from "next/server";
import { adminFromRequest } from "@/server/admin/guard";
import { connectDB } from "@/server/db";
import { listCustomers } from "@/server/services/admin-customers";
import { csvResponse, toCsv } from "@/lib/csv";
import { toDollars } from "@/lib/money";

export async function GET(request: NextRequest) {
  if (!(await adminFromRequest("customers"))) return new Response("Not allowed", { status: 403 });
  await connectDB();
  const { rows } = await listCustomers({ q: request.nextUrl.searchParams.get("q") ?? undefined, limit: 10_000 });
  const csv = toCsv(
    ["Name", "Phone", "Email", "Orders", "Spent (USD)", "Last order", "Has account"],
    rows.map((c) => [c.name, c.phone, c.email, c.orders, toDollars(c.spent), c.lastOrderAt, c.hasAccount ? "yes" : "no"]),
  );
  return csvResponse(`customers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
