import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { LeadModel, NotificationLogModel, OrderModel, SettingModel } from "@/models";
import { addItem } from "@/server/services/cart";
import { markOrderPaid, placeOrder, type StoreRules } from "@/server/services/order";
import { notifyAbandonedCarts, notifyOnlinePaid, notifyOrderPlaced, notifyOrderShipped } from "@/server/notifications";
import { orderPlacedEmail, orderShippedEmail, type OrderInfo, type Store } from "@/server/notifications/templates";
import { runAbandonedSweep } from "@/server/services/abandoned";
import { clearDb, startDb, stopDb } from "./helpers/db";
import { seedProduct } from "./helpers/fixtures";

process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-123";
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  for (const k of ["EMAIL_PROVIDER", "SMTP_HOST"]) delete process.env[k];
});
afterEach(() => vi.unstubAllGlobals());

const ZONE = "000000000000000000000001";
const rules: StoreRules = {
  zones: [{ id: ZONE, name: "UK Standard", fee: 595, etaMinDays: 3, etaMaxDays: 5, countries: [], freeEligible: false, note: "" }],
  freeDeliveryThreshold: 0,
  payments: { stripe: true, paypal: true },
};
const address = { name: "James Clarke", phone: "07700900123", line1: "14 Hartley Road", line2: "", city: "Bath", county: "Somerset", postcode: "BA1 2QH", country: "GB" };

async function order(email = "james@example.com") {
  const fx = await seedProduct();
  const { token } = await addItem(undefined, String(fx.m._id), 1);
  const { order } = await placeOrder({ cartToken: token, contact: { name: "James Clarke", phone: "07700900123", email }, address, deliveryOption: ZONE, paymentMethod: "stripe" }, rules);
  return order;
}
const logs = (filter: Record<string, unknown> = {}) => NotificationLogModel.find(filter).sort({ createdAt: 1 }).lean();

const store: Store = { name: "Oxford Vale", phone: "020 7946 0001", email: "hello@oxfordvale.example", url: "http://x", legal: "Oxford Vale Menswear Ltd. · Registered in England and Wales, company no. 00000000" };
const info: OrderInfo = {
  orderNo: "OV-261022-0001", customerName: "<b>James</b>", phone: "07700 900123", email: "j@example.com", items: [{ name: "Tweed Suit", size: "40", colour: "Brown", qty: 1, lineTotal: 26500 }],
  subtotal: 26500, discount: 0, deliveryName: "UK Standard", deliveryFee: 0, total: 26500, paymentMethod: "stripe", paymentStatus: "paid", etaMin: 3, etaMax: 5,
  address: "14 Hartley Road, Bath, Somerset, BA1 2QH, United Kingdom", link: "http://x/order/OV?key=abc", adminLink: "http://x/admin/orders/OV",
};

describe("templates", () => {
  it("escapes customer text in HTML and keeps a plain-text body in dollars", () => {
    const email = orderPlacedEmail(info, store);
    expect(email.html).toContain("&lt;b&gt;James&lt;/b&gt;");
    expect(email.html).not.toContain("<b>James</b>");
    expect(email.text).toContain("Total: $265.00");
    expect(email.text).toContain("Delivery (UK Standard): Free");
    expect(email.text).toContain("BA1 2QH, United Kingdom");
    expect(email.html).toContain("Registered in England and Wales");
  });

  it("tells an unpaid customer how to finish paying, and a paid one that the order is confirmed", () => {
    expect(orderPlacedEmail({ ...info, paymentStatus: "unpaid" }, store).text).toContain("Finish paying from your order page");
    expect(orderPlacedEmail(info, store).text).toContain("Your payment is confirmed");
  });

  it("shipped email names the courier and tracking number", () => {
    const email = orderShippedEmail({ ...info, courier: "Royal Mail", trackingNo: "RM123GB" }, store);
    expect(email.text).toContain("shipped with Royal Mail (tracking number RM123GB)");
  });
});

describe("order notifications (log provider)", () => {
  it("sends the customer and admin emails once, with the order key hidden in the log", async () => {
    const o = await order();
    await notifyOrderPlaced(o.orderNo);
    await notifyOrderPlaced(o.orderNo); // repeated call: no duplicates
    const rows = await logs();
    expect(rows.map((r) => `${r.channel}:${r.to}:${r.event}`).sort()).toEqual([
      "email:james@example.com:order.placed",
      "email:orders@oxfordvale.example:order.placed.admin",
    ]);
    expect(rows.every((r) => r.status === "logged")).toBe(true);
    const customer = rows.find((r) => r.to === "james@example.com")!;
    expect(customer.body).toContain("key=[hidden]");
    expect(customer.body).toContain("Finish paying");
  });

  it("uses the admin email from settings and skips the customer email when none was given", async () => {
    await SettingModel.create({ key: "store", storeName: "Oxford Vale", contact: { ordersEmail: "shop@example.com" } });
    const o = await order("");
    await notifyOrderPlaced(o.orderNo);
    expect((await logs()).map((r) => r.to)).toEqual(["shop@example.com"]);
  });

  it("online payments: first success sends 'order received' (paid), a later payment sends a receipt", async () => {
    const o = await order();
    await markOrderPaid(o.orderNo, { brand: "card (visa)" }, "Paid online via Stripe");
    await notifyOnlinePaid(o.orderNo);
    const first = await logs({ to: "james@example.com" });
    expect(first.map((r) => r.event)).toEqual(["order.placed"]);
    expect(first[0].body).toContain("Your payment is confirmed");
    await notifyOnlinePaid(o.orderNo);
    expect((await logs({ to: "james@example.com" })).map((r) => r.event)).toEqual(["order.placed", "order.paid"]);
  });

  it("shipped: one email with courier and tracking", async () => {
    const o = await order();
    await OrderModel.updateOne({ orderNo: o.orderNo }, { status: "shipped", shipment: { courier: "DPD", trackingNo: "DPD-77" } });
    await notifyOrderShipped(o.orderNo);
    await notifyOrderShipped(o.orderNo);
    const sent = await logs({ event: "order.shipped" });
    expect(sent).toHaveLength(1);
    expect(sent[0].body).toContain("shipped with DPD (tracking number DPD-77)");
  });

  it("a failing provider is logged as failed and never throws; a later retry still sends", async () => {
    process.env.EMAIL_PROVIDER = "smtp"; // no SMTP_HOST → config error
    const o = await order();
    await expect(notifyOrderPlaced(o.orderNo)).resolves.toBeUndefined();
    const failed = await logs({ status: "failed" });
    expect(failed).toHaveLength(2);
    expect(failed[0].error).toContain("SMTP_HOST");
    delete process.env.EMAIL_PROVIDER;
    await notifyOrderPlaced(o.orderNo);
    expect(await NotificationLogModel.countDocuments({ status: "logged" })).toBe(2);
  });
});

describe("abandoned-cart digest", () => {
  const lead = (name: string, minutesAgo: number) =>
    LeadModel.create({ name, phone: "07700900222", status: "cart", cartValue: 3000, lastActivityAt: new Date(Date.now() - minutesAgo * 60_000), cartSnapshot: [{ name: "Linen Shirt", size: "M", qty: 1, unitPrice: 3000 }] });

  it("marks idle carts abandoned, emails one digest and never repeats it", async () => {
    await lead("Idle One", 90);
    await lead("Idle Two", 120);
    await lead("Still Shopping", 5);
    const first = await runAbandonedSweep();
    expect(first).toMatchObject({ abandoned: 2, notified: 2 });
    const digest = (await logs({ channel: "email" }))[0];
    expect(digest.subject).toBe("2 abandoned carts worth $60.00");
    expect(digest.body).toContain("Idle One");
    expect(await runAbandonedSweep()).toMatchObject({ abandoned: 0, notified: 0 });
    expect(await NotificationLogModel.countDocuments()).toBe(1);
  });

  it("releases the claim when the email fails, so the next run retries", async () => {
    await lead("Idle", 90);
    process.env.EMAIL_PROVIDER = "smtp";
    expect(await runAbandonedSweep()).toMatchObject({ abandoned: 1, notified: 0 });
    expect((await LeadModel.findOne({ name: "Idle" }).lean())!.adminNotifiedAt).toBeUndefined();
    delete process.env.EMAIL_PROVIDER;
    expect(await notifyAbandonedCarts(60)).toEqual({ sent: 1 });
  });
});
