// Order list filters shared by the admin orders page and its CSV export.
import { ORDER_STATUSES, PAYMENT_METHODS, type OrderStatus } from "@/models";
import { dhakaDayStart } from "./admin-dashboard";

export type OrderFilterParams = { q?: string; status?: string; payment?: string; method?: string; from?: string; to?: string };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const dayStart = (iso: string) => dhakaDayStart(new Date(`${iso}T12:00:00+06:00`));

export function orderFilter(p: OrderFilterParams): Record<string, unknown> {
  const f: Record<string, unknown> = {};
  const statuses = (p.status ?? "").split(",").filter((s): s is OrderStatus => (ORDER_STATUSES as readonly string[]).includes(s));
  if (statuses.length) f.status = { $in: statuses };
  if (p.payment === "verify") Object.assign(f, { paymentMethod: { $in: ["bkash", "nagad"] }, paymentStatus: { $ne: "paid" }, "payment.submittedAt": { $exists: true }, ...(!statuses.length && { status: { $nin: ["cancelled", "returned", "refunded"] } }) });
  else if (["paid", "unpaid", "failed", "refunded"].includes(p.payment ?? "")) f.paymentStatus = p.payment;
  if ((PAYMENT_METHODS as readonly string[]).includes(p.method ?? "")) f.paymentMethod = p.method;
  const created: Record<string, Date> = {};
  if (/^\d{4}-\d{2}-\d{2}$/.test(p.from ?? "")) created.$gte = dayStart(p.from!);
  if (/^\d{4}-\d{2}-\d{2}$/.test(p.to ?? "")) created.$lt = new Date(dayStart(p.to!).getTime() + 864e5);
  if (Object.keys(created).length) f.createdAt = created;
  const q = p.q?.trim().slice(0, 60);
  if (q) {
    const digits = q.replace(/\D/g, "");
    const rx = new RegExp(escape(q), "i");
    f.$or = [{ orderNo: rx }, { "customer.name": rx }, { "customer.email": rx }, ...(digits.length >= 4 ? [{ "customer.phone": new RegExp(escape(digits)) }] : []), { "payment.trxId": rx }];
  }
  return f;
}

export const pickOrderParams = (sp: Record<string, string | string[] | undefined>): OrderFilterParams => {
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  return { q: one("q"), status: one("status"), payment: one("payment"), method: one("method"), from: one("from"), to: one("to") };
};
