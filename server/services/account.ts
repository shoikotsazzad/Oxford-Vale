import "server-only";
import { OrderModel, UserModel } from "@/models";
import type { OrderRow } from "@/components/account/OrdersTable";

export async function getUserOrders(userId: string, limit = 50): Promise<OrderRow[]> {
  const orders = await OrderModel.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).select("orderNo createdAt total status items.qty").lean();
  return orders.map((o) => ({ orderNo: o.orderNo, createdAt: o.createdAt.toISOString(), total: o.total, status: o.status, items: o.items.reduce((n, i) => n + i.qty, 0) }));
}

export async function getUserProfile(userId: string) {
  const u = await UserModel.findById(userId).select("name email phone addresses").lean();
  if (!u) return null;
  return {
    name: u.name, email: u.email, phone: u.phone ?? "",
    addresses: u.addresses.map((a) => ({
      id: String(a._id), label: a.label ?? "Home", isDefault: Boolean(a.isDefault), name: a.name, phone: a.phone,
      line1: a.line1, line2: a.line2 ?? "", city: a.city, county: a.county ?? "", postcode: a.postcode ?? "", country: a.country,
    })),
  };
}
