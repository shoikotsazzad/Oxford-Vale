import "server-only";
import { OrderModel, type OrderStatus, type PaymentMethod, type PaymentStatus } from "@/models";
import type { PostalAddress } from "@/lib/address";

export type OrderViewDTO = {
  orderNo: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  /** How it was paid, e.g. "card (visa)", "PayPal", "klarna". */
  paidWith: string | null;
  customer: { name: string; phone: string; email: string };
  address: PostalAddress & { name: string; phone: string };
  items: { sku: string; name: string; size: string; colour: string; image: string; unitPrice: number; regularPrice: number; qty: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  delivery: { name: string; fee: number; etaMinDays: number; etaMaxDays: number };
  total: number;
  note: string;
  shipment: { courier: string; trackingNo: string } | null;
  history: { status: OrderStatus; at: string; note: string }[];
  userId: string | null;
};

export async function getOrderView(orderNo: string): Promise<OrderViewDTO | null> {
  const o = await OrderModel.findOne({ orderNo }).lean();
  if (!o) return null;
  return {
    orderNo: o.orderNo,
    createdAt: o.createdAt.toISOString(),
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    paidWith: o.paymentStatus === "paid" ? (o.payment?.brand ?? null) : null,
    customer: { name: o.customer!.name, phone: o.customer!.phone, email: o.customer!.email ?? "" },
    address: {
      name: o.shippingAddress!.name, phone: o.shippingAddress!.phone, line1: o.shippingAddress!.line1, line2: o.shippingAddress!.line2 ?? "",
      city: o.shippingAddress!.city, county: o.shippingAddress!.county ?? "", postcode: o.shippingAddress!.postcode ?? "", country: o.shippingAddress!.country,
    },
    items: o.items.map((i) => ({ sku: i.sku, name: i.name, size: i.size ?? "", colour: i.colour ?? "", image: i.image ?? "", unitPrice: i.unitPrice, regularPrice: i.regularPrice, qty: i.qty, lineTotal: i.lineTotal })),
    subtotal: o.subtotal,
    discount: o.discount ?? 0,
    couponCode: o.couponCode ?? null,
    delivery: { name: o.delivery?.name ?? "", fee: o.delivery?.fee ?? 0, etaMinDays: o.delivery?.etaMinDays ?? 0, etaMaxDays: o.delivery?.etaMaxDays ?? 0 },
    total: o.total,
    note: o.note ?? "",
    shipment: o.shipment?.courier ? { courier: o.shipment.courier, trackingNo: o.shipment.trackingNo ?? "" } : null,
    history: o.statusHistory.map((h) => ({ status: h.status!, at: (h.at ?? o.createdAt).toISOString(), note: h.note ?? "" })),
    userId: o.user ? String(o.user) : null,
  };
}
