// Customers (grouped by phone across all orders, so guests are included) and cart leads.
import { LeadModel, OrderModel, type OrderStatus } from "@/models";

const LOST: OrderStatus[] = ["cancelled", "returned", "refunded"];
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type CustomerRow = { phone: string; name: string; email: string; orders: number; spent: number; lastOrderAt: Date; hasAccount: boolean };

export async function listCustomers({ q, skip = 0, limit = 25 }: { q?: string; skip?: number; limit?: number }) {
  const rx = q?.trim() ? new RegExp(escape(q.trim().slice(0, 60)), "i") : null;
  const [res] = await OrderModel.aggregate<{ rows: CustomerRow[]; total: { n: number }[] }>([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$customer.phone",
        name: { $first: "$customer.name" },
        email: { $first: "$customer.email" },
        orders: { $sum: 1 },
        spent: { $sum: { $cond: [{ $in: ["$status", LOST] }, 0, "$total"] } },
        lastOrderAt: { $first: "$createdAt" },
        hasAccount: { $max: { $cond: [{ $ifNull: ["$user", false] }, true, false] } },
      },
    },
    ...(rx ? [{ $match: { $or: [{ _id: rx }, { name: rx }, { email: rx }] } }] : []),
    { $sort: { lastOrderAt: -1 } },
    { $facet: { rows: [{ $skip: skip }, { $limit: limit }, { $addFields: { phone: "$_id" } }], total: [{ $count: "n" }] } },
  ]);
  return { rows: res?.rows ?? [], total: res?.total[0]?.n ?? 0 };
}

export function leadFilter({ q, status }: { q?: string; status?: string }) {
  const f: Record<string, unknown> = {};
  if (["cart", "abandoned", "converted"].includes(status ?? "")) f.status = status;
  const t = q?.trim().slice(0, 60);
  if (t) {
    const rx = new RegExp(escape(t), "i");
    f.$or = [{ name: rx }, { phone: rx }, { email: rx }];
  }
  return f;
}

export async function listLeads(filter: Record<string, unknown>, { skip = 0, limit = 25 } = {}) {
  const [rows, total] = await Promise.all([
    LeadModel.find(filter).sort({ lastActivityAt: -1 }).skip(skip).limit(limit).populate<{ order: { orderNo: string } | null }>("order", "orderNo").lean(),
    LeadModel.countDocuments(filter),
  ]);
  return { rows, total };
}
