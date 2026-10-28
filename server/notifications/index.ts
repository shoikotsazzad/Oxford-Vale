// Notification events. Each one loads what it needs, sends through notify.ts (logged + de-duplicated) and never throws,
// so callers can run them in after() without risking the shopper's request. No Next.js APIs: scripts can use them too.
import { ContactMessageModel, LeadModel, NotificationLogModel, OrderModel, SettingModel, type Lead, type Order } from "@/models";
import { sendEmail, sendSms } from "@/server/services/notify";
import { orderUrl } from "@/server/services/payment-redirect";
import { site } from "@/data/site";
import * as T from "./templates";

const baseUrl = () => (process.env.APP_URL || site.url).replace(/\/$/, "");

async function storeInfo(): Promise<T.Store & { ordersEmail: string }> {
  const s = await SettingModel.findOne({ key: "store" }).select("storeName contact payments").lean();
  return {
    name: s?.storeName || site.name,
    phone: s?.contact?.phone || site.phoneDisplay,
    whatsapp: s?.contact?.whatsapp || site.whatsappDisplay,
    email: s?.contact?.email || site.email,
    ordersEmail: s?.contact?.ordersEmail || site.ordersEmail,
    bkash: s?.payments?.bkash?.number || site.payments.bkashNumber,
    nagad: s?.payments?.nagad?.number || site.payments.nagadNumber,
    url: baseUrl(),
  };
}

function orderInfo(o: Order): T.OrderInfo {
  const a = o.shippingAddress!;
  return {
    orderNo: o.orderNo, customerName: o.customer!.name, phone: o.customer!.phone, email: o.customer!.email ?? "",
    items: o.items.map((i) => ({ name: i.name, size: i.size, colour: i.colour, qty: i.qty, lineTotal: i.lineTotal })),
    subtotal: o.subtotal, discount: o.discount ?? 0, couponCode: o.couponCode, deliveryName: o.delivery?.name ?? "", deliveryFee: o.delivery?.fee ?? 0, total: o.total,
    paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus, etaMin: o.delivery?.etaMinDays ?? 0, etaMax: o.delivery?.etaMaxDays ?? 0,
    address: `${a.addressLine}, ${a.upazila}, ${a.district}`, note: o.note,
    link: `${baseUrl()}${orderUrl(o.orderNo)}`, adminLink: `${baseUrl()}/admin/orders/${o.orderNo}`,
    courier: o.shipment?.courier ?? undefined, trackingNo: o.shipment?.trackingNo ?? undefined,
  };
}

/** Run a notification without ever throwing (a failed send is already in NotificationLog). */
async function safely(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err) {
    console.error(`[notify] ${label} failed`, err);
  }
}

/** Order placed: customer email + SMS, admin email. */
export function notifyOrderPlaced(orderNo: string) {
  return safely(`order.placed ${orderNo}`, async () => {
    const o = await OrderModel.findOne({ orderNo }).lean();
    if (!o) return;
    const [store, info] = [await storeInfo(), orderInfo(o)];
    const ref = { type: "order", id: orderNo };
    const email = T.orderPlacedEmail(info, store);
    await Promise.all([
      info.email && sendEmail({ to: info.email, ...email, replyTo: store.email }, ref, "order.placed"),
      sendSms({ to: info.phone, text: T.orderPlacedSms(info, store) }, ref, "order.placed"),
      store.ordersEmail && sendEmail({ to: store.ordersEmail, ...T.adminNewOrderEmail(info, store), replyTo: info.email || undefined }, ref, "order.placed.admin"),
    ]);
  });
}

/** Online payment confirmed or bKash/Nagad verified: customer email. */
export function notifyPaymentReceived(orderNo: string) {
  return safely(`order.paid ${orderNo}`, async () => {
    const o = await OrderModel.findOne({ orderNo }).lean();
    if (!o?.customer?.email || o.paymentStatus !== "paid") return;
    const store = await storeInfo();
    await sendEmail({ to: o.customer.email, ...T.paymentReceivedEmail(orderInfo(o), store), replyTo: store.email }, { type: "order", id: orderNo }, "order.paid");
  });
}

/** SSLCommerz paid: the "order received" message (showing paid) if it wasn't sent yet, otherwise a payment receipt. */
export function notifyOnlinePaid(orderNo: string) {
  return safely(`online paid ${orderNo}`, async () => {
    const placed = await NotificationLogModel.exists({ event: "order.placed", "ref.id": orderNo, status: { $in: ["sent", "logged"] } });
    await (placed ? notifyPaymentReceived(orderNo) : notifyOrderPlaced(orderNo));
  });
}

/** Shipped: customer SMS (plan §4) + email with courier and tracking number. */
export function notifyOrderShipped(orderNo: string) {
  return safely(`order.shipped ${orderNo}`, async () => {
    const o = await OrderModel.findOne({ orderNo }).lean();
    if (!o || o.status !== "shipped") return;
    const [store, info] = [await storeInfo(), orderInfo(o)];
    const ref = { type: "order", id: orderNo };
    await Promise.all([
      sendSms({ to: info.phone, text: T.orderShippedSms(info, store) }, ref, "order.shipped"),
      info.email && sendEmail({ to: info.email, ...T.orderShippedEmail(info, store), replyTo: store.email }, ref, "order.shipped"),
    ]);
  });
}

/** Contact form: admin email; replying goes straight to the visitor. */
export function notifyContactMessage(id: string) {
  return safely(`contact ${id}`, async () => {
    const m = await ContactMessageModel.findById(id).lean();
    if (!m) return;
    const store = await storeInfo();
    const to = store.email;
    await sendEmail({ to, ...T.adminContactEmail({ ...m, adminLink: `${baseUrl()}/admin/messages` }, store), replyTo: m.email }, { type: "contact", id }, "contact.new");
  });
}

/**
 * One digest email for abandoned carts nobody was told about yet (last 3 days, max 50).
 * Leads are claimed first (adminNotifiedAt = this run's timestamp) so overlapping runs can't send twice;
 * if the email fails the claim is released and the next run tries again.
 */
export async function notifyAbandonedCarts(minutes: number, now = new Date()) {
  let sent = 0;
  await safely("abandoned digest", async () => {
    const store = await storeInfo();
    if (!store.ordersEmail) return;
    const due = await LeadModel.find({ status: "abandoned", adminNotifiedAt: { $exists: false }, abandonedAt: { $gte: new Date(now.getTime() - 3 * 864e5) } })
      .sort({ cartValue: -1 }).limit(50).select("_id").lean();
    if (!due.length) return;
    const claim = new Date(now.getTime() + Math.floor(Math.random() * 1000)); // unique per run
    await LeadModel.updateMany({ _id: { $in: due.map((d) => d._id) }, adminNotifiedAt: { $exists: false } }, { adminNotifiedAt: claim });
    const leads: Lead[] = await LeadModel.find({ adminNotifiedAt: claim }).sort({ cartValue: -1 }).lean();
    if (!leads.length) return;
    const email = T.abandonedDigestEmail(
      leads.map((l) => ({ name: l.name, phone: l.phone, email: l.email, cartValue: l.cartValue, lastActivityAt: l.lastActivityAt, items: l.cartSnapshot.map((i) => `${i.qty}× ${i.name}${i.size ? ` (${i.size})` : ""}`) })),
      minutes,
      `${baseUrl()}/admin/customers?tab=leads&status=abandoned`,
      store,
    );
    if (await sendEmail({ to: store.ordersEmail, ...email }, { type: "leads", id: `digest-${claim.getTime()}` })) sent = leads.length;
    else await LeadModel.updateMany({ adminNotifiedAt: claim }, { $unset: { adminNotifiedAt: 1 } });
  });
  return { sent };
}

/** Admin → Settings "send test": returns the provider result so the owner can see what happened. */
export async function sendTest(channel: "email" | "sms", to: string) {
  const store = await storeInfo();
  return channel === "email"
    ? sendEmail({ to, ...T.testEmail(store) }, { type: "test", id: to })
    : sendSms({ to, text: `${store.name}: test SMS from the admin. SMS sending works.` }, { type: "test", id: to });
}
