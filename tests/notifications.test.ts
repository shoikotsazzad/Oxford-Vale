import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { LeadModel, NotificationLogModel, OrderModel, SettingModel } from "@/models";
import { addItem } from "@/server/services/cart";
import { placeOrder, type StoreRules } from "@/server/services/order";
import { notifyAbandonedCarts, notifyOnlinePaid, notifyOrderPlaced, notifyOrderShipped } from "@/server/notifications";
import { orderPlacedEmail, orderPlacedSms, type OrderInfo, type Store } from "@/server/notifications/templates";
import { runAbandonedSweep } from "@/server/services/abandoned";
import { toMsisdn } from "@/server/adapters/sms";
import { clearDb, startDb, stopDb } from "./helpers/db";
import { seedProduct } from "./helpers/fixtures";

process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-123";
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  for (const k of ["EMAIL_PROVIDER", "SMS_PROVIDER", "SMTP_HOST", "SSLWIRELESS_API_TOKEN", "SSLWIRELESS_SID", "BULKSMSBD_API_KEY", "BULKSMSBD_SENDER_ID"]) delete process.env[k];
});
afterEach(() => vi.unstubAllGlobals());

const rules: StoreRules = {
  zones: [{ id: "000000000000000000000001", name: "Everywhere", fee: 100, etaMinDays: 2, etaMaxDays: 4, match: { divisions: [], districts: [], areas: [] } }],
  freeDeliveryThreshold: 0,
  payments: { cod: true, sslcommerz: true, bkash: { enabled: true }, nagad: { enabled: true } },
};
const address = { name: "Rafi Ahmed", phone: "01711111111", division: "Dhaka", district: "Dhaka", upazila: "Gulshan", addressLine: "House 1" };

async function order(paymentMethod: "cod" | "bkash" | "sslcommerz" = "cod", email = "rafi@example.com") {
  const fx = await seedProduct();
  const { token } = await addItem(undefined, String(fx.m._id), 1);
  const { order } = await placeOrder({ cartToken: token, contact: { name: "Rafi Ahmed", phone: "01711111111", email }, address, paymentMethod }, rules);
  return order;
}
const logs = (filter: Record<string, unknown> = {}) => NotificationLogModel.find(filter).sort({ createdAt: 1 }).lean();

const store: Store = { name: "Oxford Vale", phone: "01700-000001", whatsapp: "01700-000002", email: "hello@oxfordvale.example", url: "http://x", bkash: "01700-000003", nagad: "01700-000004" };
const info: OrderInfo = {
  orderNo: "OV-261022-0001", customerName: "<b>Rafi</b>", phone: "01711111111", email: "r@example.com", items: [{ name: "Tweed Suit", size: "40", colour: "Brown", qty: 1, lineTotal: 25000 }],
  subtotal: 25000, discount: 0, deliveryName: "Dhaka City", deliveryFee: 80, total: 25080, paymentMethod: "bkash", paymentStatus: "unpaid", etaMin: 1, etaMax: 2,
  address: "House 1, Gulshan, Dhaka", link: "http://x/order/OV?key=abc", adminLink: "http://x/admin/orders/OV",
};

describe("templates", () => {
  it("SMS uses Tk (not ৳, which forces Unicode SMS) and tells bKash customers where to pay", () => {
    const sms = orderPlacedSms(info, store);
    expect(sms).toContain("Tk 25,080");
    expect(sms).toContain("bKash 01700-000003");
    expect(sms).not.toContain("৳");
  });

  it("escapes customer text in HTML and keeps a plain-text body", () => {
    const email = orderPlacedEmail(info, store);
    expect(email.html).toContain("&lt;b&gt;Rafi&lt;/b&gt;");
    expect(email.html).not.toContain("<b>Rafi</b>");
    expect(email.text).toContain("Total: ৳25,080");
  });

  it("normalises Bangladeshi numbers for the SMS gateways", () => {
    expect(toMsisdn("01711-111111")).toBe("8801711111111");
    expect(toMsisdn("+880 1711 111111")).toBe("8801711111111");
    expect(() => toMsisdn("12345")).toThrow();
  });
});

describe("order notifications (log providers)", () => {
  it("sends customer email + SMS and the admin email once, with the order key hidden in the log", async () => {
    const o = await order("cod");
    await notifyOrderPlaced(o.orderNo);
    await notifyOrderPlaced(o.orderNo); // repeated call: no duplicates
    const rows = await logs();
    expect(rows.map((r) => `${r.channel}:${r.to}:${r.event}`).sort()).toEqual([
      "email:orders@oxfordvale.example:order.placed.admin",
      "email:rafi@example.com:order.placed",
      "sms:01711111111:order.placed",
    ]);
    expect(rows.every((r) => r.status === "logged")).toBe(true);
    const sms = rows.find((r) => r.channel === "sms")!;
    expect(sms.body).toContain("Pay Tk");
    expect(sms.body).toContain("key=[hidden]");
  });

  it("uses the admin email from settings and skips the customer email when none was given", async () => {
    await SettingModel.create({ key: "store", storeName: "Oxford Vale", contact: { ordersEmail: "shop@example.com" } });
    const o = await order("cod", "");
    await notifyOrderPlaced(o.orderNo);
    expect((await logs()).map((r) => r.to).sort()).toEqual(["01711111111", "shop@example.com"]);
  });

  it("card payments: first success sends 'order received', a later payment sends a receipt", async () => {
    const o = await order("sslcommerz");
    await OrderModel.updateOne({ orderNo: o.orderNo }, { paymentStatus: "paid" });
    await notifyOnlinePaid(o.orderNo);
    expect((await logs({ channel: "email", to: "rafi@example.com" })).map((r) => r.event)).toEqual(["order.placed"]);
    await notifyOnlinePaid(o.orderNo);
    expect((await logs({ channel: "email", to: "rafi@example.com" })).map((r) => r.event)).toEqual(["order.placed", "order.paid"]);
  });

  it("shipped: SMS + email with courier and tracking", async () => {
    const o = await order("cod");
    await OrderModel.updateOne({ orderNo: o.orderNo }, { status: "shipped", shipment: { courier: "Pathao", trackingNo: "P-77" } });
    await notifyOrderShipped(o.orderNo);
    const sms = (await logs({ channel: "sms", event: "order.shipped" }))[0];
    expect(sms.body).toContain("shipped with Pathao, tracking P-77");
    expect(sms.body).toContain("Keep Tk");
    expect(await NotificationLogModel.countDocuments({ channel: "email", event: "order.shipped" })).toBe(1);
  });
});

describe("real providers", () => {
  it("a failing provider is logged as failed and never throws; a later retry still sends", async () => {
    process.env.EMAIL_PROVIDER = "smtp"; // no SMTP_HOST → config error
    const o = await order("cod");
    await expect(notifyOrderPlaced(o.orderNo)).resolves.toBeUndefined();
    const failed = await logs({ channel: "email", status: "failed" });
    expect(failed).toHaveLength(2);
    expect(failed[0].error).toContain("SMTP_HOST");
    delete process.env.EMAIL_PROVIDER;
    await notifyOrderPlaced(o.orderNo);
    expect(await NotificationLogModel.countDocuments({ channel: "email", status: "logged" })).toBe(2);
    expect(await NotificationLogModel.countDocuments({ channel: "sms" })).toBe(1); // already sent, not repeated
  });

  it("SSL Wireless: posts JSON to the v3 API and records the reference id", async () => {
    Object.assign(process.env, { SMS_PROVIDER: "sslwireless", SSLWIRELESS_API_TOKEN: "t", SSLWIRELESS_SID: "OXFORDVALE" });
    const fetchMock = vi.fn(async () => Response.json({ status: "SUCCESS", status_code: 200, smsinfo: [{ sms_status: "SUCCESS", reference_id: "ref-1" }] }));
    vi.stubGlobal("fetch", fetchMock);
    const o = await order("cod");
    await notifyOrderPlaced(o.orderNo);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://smsplus.sslwireless.com/api/v3/send-sms");
    expect(JSON.parse(String(init.body))).toMatchObject({ sid: "OXFORDVALE", msisdn: "8801711111111", csms_id: o.orderNo });
    expect((await logs({ channel: "sms" }))[0]).toMatchObject({ provider: "sslwireless", status: "sent" });
  });

  it("BulkSMSBD: a rejected request is logged with the gateway's error", async () => {
    Object.assign(process.env, { SMS_PROVIDER: "bulksmsbd", BULKSMSBD_API_KEY: "k", BULKSMSBD_SENDER_ID: "8809600000000" });
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ response_code: 1007, error_message: "Balance insufficient" })));
    const o = await order("cod");
    await notifyOrderPlaced(o.orderNo);
    expect((await logs({ channel: "sms" }))[0]).toMatchObject({ provider: "bulksmsbd", status: "failed", error: "BulkSMSBD rejected the SMS: Balance insufficient" });
  });
});

describe("abandoned-cart digest", () => {
  const lead = (name: string, minutesAgo: number) =>
    LeadModel.create({ name, phone: "01722222222", status: "cart", cartValue: 3000, lastActivityAt: new Date(Date.now() - minutesAgo * 60_000), cartSnapshot: [{ name: "Linen Shirt", size: "M", qty: 1, unitPrice: 3000 }] });

  it("marks idle carts abandoned, emails one digest and never repeats it", async () => {
    await lead("Idle One", 90);
    await lead("Idle Two", 120);
    await lead("Still Shopping", 5);
    const first = await runAbandonedSweep();
    expect(first).toMatchObject({ abandoned: 2, notified: 2 });
    const digest = (await logs({ channel: "email" }))[0];
    expect(digest.subject).toBe("2 abandoned carts worth ৳6,000");
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
