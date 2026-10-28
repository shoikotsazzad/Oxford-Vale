import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import { formatBDT } from "@/lib/money";
import type { OrderStatus } from "@/models/enums";
import { StatusBadge } from "@/components/order/OrderDetails";

export type OrderRow = { orderNo: string; createdAt: string; total: number; status: OrderStatus; items: number };

export function OrdersTable({ orders, t }: { orders: OrderRow[]; t: Dict }) {
  const date = (iso: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Dhaka" }).format(new Date(iso));
  return (
    <ul className="divide-y divide-line border-y border-line">
      {orders.map((o) => (
        <li key={o.orderNo}>
          <Link href={`/account/orders/${o.orderNo}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-4 hover:bg-sand/50 sm:grid-cols-[1fr_8rem_7rem_6rem]">
            <span className="text-sm font-medium">{o.orderNo}<span className="block text-xs font-normal text-muted">{date(o.createdAt)} · {o.items} items</span></span>
            <span className="text-sm sm:order-none">{formatBDT(o.total)}</span>
            <span><StatusBadge text={t.order.statuses[o.status]} tone={["cancelled", "returned", "refunded"].includes(o.status) ? "bad" : o.status === "delivered" ? "ok" : "neutral"} /></span>
            <span className="label hidden text-right sm:block">{t.account.view} →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
