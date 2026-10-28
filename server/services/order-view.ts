import "server-only";
import { OrderModel, isAwaitingVerification, type OrderStatus, type PaymentMethod, type PaymentStatus } from "@/models";

export type OrderViewDTO = {
  orderNo: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  awaitingVerification: boolean;
  trxId: string | null;
  customer: { name: string; phone: string; email: string };
  address: { name: string; phone: string; division: string; district: string; upazila: string; addressLine: string };
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
    awaitingVerification: isAwaitingVerification(o),
    trxId: o.payment?.trxId ?? null,
    customer: { name: o.customer!.name, phone: o.customer!.phone, email: o.customer!.email ?? "" },
    address: { ...o.shippingAddress! },
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
