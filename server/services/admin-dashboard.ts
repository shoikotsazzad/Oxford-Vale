// Dashboard numbers. "Sales" = orders that are not cancelled, returned or refunded, by order date in Dhaka time.
import { ContactMessageModel, LeadModel, OrderModel, VariantModel, isAwaitingVerification, type OrderStatus } from "@/models";

const TZ = "+06:00";
const LOST: OrderStatus[] = ["cancelled", "returned", "refunded"];
const DAY = 864e5;

/** Start of the Dhaka calendar day containing `d`, as a UTC Date. */
export function dhakaDayStart(d: Date) {
  const shifted = new Date(d.getTime() + 6 * 3600_000);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - 6 * 3600_000);
}
export const dhakaDateKey = (d: Date) => new Date(d.getTime() + 6 * 3600_000).toISOString().slice(0, 10);

async function salesSince(from: Date) {
  const [row] = await OrderModel.aggregate<{ revenue: number; orders: number }>([
    { $match: { createdAt: { $gte: from }, status: { $nin: LOST } } },
    { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
  ]);
  return { revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 };
}

export async function getDashboard(lowStockThreshold: number, now = new Date()) {
  const today = dhakaDayStart(now);
  const days = 30;
  const from30 = new Date(today.getTime() - (days - 1) * DAY);

  const [todaySales, week, month, daily, attention, lowStock, recentOrders, leads, topProducts] = await Promise.all([
    salesSince(today),
    salesSince(new Date(today.getTime() - 6 * DAY)),
    salesSince(from30),
    OrderModel.aggregate<{ _id: string; revenue: number; orders: number }>([
      { $match: { createdAt: { $gte: from30 }, status: { $nin: LOST } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    ]),
    Promise.all([
      OrderModel.countDocuments({ status: "pending" }),
      OrderModel.countDocuments({ paymentMethod: { $in: ["bkash", "nagad"] }, paymentStatus: { $ne: "paid" }, "payment.submittedAt": { $exists: true }, status: { $nin: LOST } }),
      OrderModel.countDocuments({ status: { $in: ["confirmed", "processing"] } }),
      ContactMessageModel.countDocuments({ status: "new" }),
    ]),
    VariantModel.aggregate<{ _id: unknown; sku: string; size: string; colour: string; stock: number; product: { _id: unknown; name: string } }>([
      { $match: { isActive: true, stock: { $lte: lowStockThreshold } } },
      { $lookup: { from: "products", localField: "product", foreignField: "_id", as: "product", pipeline: [{ $project: { name: 1, status: 1 } }] } },
      { $unwind: "$product" },
      { $match: { "product.status": "active" } },
      { $sort: { stock: 1, sku: 1 } },
      { $limit: 8 },
      { $project: { sku: 1, size: 1, colour: 1, stock: 1, "product._id": 1, "product.name": 1 } },
    ]),
    OrderModel.find().sort({ createdAt: -1 }).limit(8).select("orderNo customer.name total status paymentStatus paymentMethod payment.submittedAt createdAt").lean(),
    LeadModel.find({ status: { $in: ["cart", "abandoned"] }, cartValue: { $gt: 0 } }).sort({ lastActivityAt: -1 }).limit(6).select("name phone status cartValue lastActivityAt").lean(),
    OrderModel.aggregate<{ _id: unknown; name: string; qty: number; revenue: number }>([
      { $match: { createdAt: { $gte: from30 }, status: { $nin: LOST } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.product", name: { $first: "$items.name" }, qty: { $sum: "$items.qty" }, revenue: { $sum: "$items.lineTotal" } } },
      { $sort: { qty: -1, revenue: -1 } },
      { $limit: 5 },
    ]),
  ]);

  // One bar per day, including days with no sales.
  const byDay = new Map(daily.map((d) => [d._id, d]));
  const chart = Array.from({ length: days }, (_, i) => {
    const key = dhakaDateKey(new Date(from30.getTime() + i * DAY));
    return { date: key, revenue: byDay.get(key)?.revenue ?? 0, orders: byDay.get(key)?.orders ?? 0 };
  });

  const [pending, awaitingPayment, toShip, newMessages] = attention;
  return {
    today: todaySales,
    week,
    month: { ...month, aov: month.orders ? Math.round(month.revenue / month.orders) : 0 },
    chart,
    attention: { pending, awaitingPayment, toShip, newMessages },
    lowStock: lowStock.map((v) => ({ productId: String(v.product._id), name: v.product.name, sku: v.sku, size: v.size, colour: v.colour, stock: v.stock })),
    recentOrders: recentOrders.map((o) => ({
      orderNo: o.orderNo, name: o.customer?.name ?? "", total: o.total, status: o.status, paymentStatus: o.paymentStatus,
      awaiting: isAwaitingVerification(o), createdAt: o.createdAt.toISOString(),
    })),
    leads: leads.map((l) => ({ id: String(l._id), name: l.name, phone: l.phone, status: l.status, cartValue: l.cartValue, lastActivityAt: l.lastActivityAt.toISOString() })),
    topProducts: topProducts.map((p) => ({ id: String(p._id), name: p.name, qty: p.qty, revenue: p.revenue })),
  };
}
export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;
