"use server";
import { after } from "next/server";
import { notifyOrderPlaced } from "@/server/notifications";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { connectDB } from "@/server/db";
import { OrderModel, UserModel, type Order } from "@/models";
import { getCartToken, CART_COOKIE } from "@/server/cart-cookie";
import { createSession, getCurrentUser } from "@/server/auth/session";
import { hashPassword } from "@/server/auth/password";
import { orderKey, verifyOrderKey } from "@/server/crypto";
import { clientIp, LIMITS, rateLimit } from "@/server/rate-limit";
import { cleanFields, cleanText } from "@/server/sanitize";
import { fail, fromZod, ok, type Result } from "@/server/result";
import { getSettings } from "@/server/services/settings";
import { getZones } from "@/server/services/delivery";
import { findCart } from "@/server/services/cart";
import { upsertLead } from "@/server/services/lead";
import { cancelOrder, OrderError, placeOrder, priceCart, quote, type Quote, type StoreRules } from "@/server/services/order";
import { initPayment, type GatewayOrder } from "@/server/adapters/payments/sslcommerz";
import { payUrl, orderUrl } from "@/server/services/payment-redirect";
import { checkoutSchema, manualPaymentSchema, trackSchema } from "@/lib/validation/checkout";
import { leadSchema } from "@/lib/validation/cart";
import { CATALOG_TAG } from "@/server/services/catalog";

type OrderForGateway = Pick<Order, "orderNo" | "total" | "customer" | "shippingAddress" | "items">;
const gatewayOrder = (o: OrderForGateway): GatewayOrder => ({
  orderNo: o.orderNo,
  total: o.total,
  customer: o.customer!,
  address: o.shippingAddress!,
  itemCount: o.items.reduce((n, i) => n + i.qty, 0),
  productNames: o.items.map((i) => i.name).join(", "),
});

async function rules(): Promise<StoreRules> {
  const [settings, zones] = await Promise.all([getSettings(), getZones()]);
  return { zones, freeDeliveryThreshold: settings.freeDeliveryThreshold, payments: settings.payments };
}

function handle(err: unknown, fallback = "Something went wrong. Please try again.") {
  if (err instanceof OrderError) return fail(err.code, err.message, err.fields);
  console.error("checkout action failed", err);
  return fail("SERVER_ERROR", fallback);
}

export type QuoteResult = Quote & { problems: string[] };

/** Live order summary while the shopper fills in the form. */
export async function getCheckoutQuote(input: { division?: string; district?: string; upazila?: string; couponCode?: string; phone?: string }): Promise<Result<QuoteResult>> {
  try {
    await connectDB();
    const { lines, problems } = await priceCart(await getCartToken());
    const address = input.district && input.upazila && input.division ? { division: input.division, district: input.district, upazila: input.upazila } : null;
    const { coupon: _c, ...q } = await quote(lines, await rules(), { address, couponCode: input.couponCode?.slice(0, 30), phone: input.phone });
    return ok({ ...q, problems });
  } catch (err) {
    return handle(err);
  }
}

/** Lead capture at checkout start (contact details entered, before ordering). */
export async function saveCheckoutLead(input: unknown): Promise<Result<null>> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await connectDB();
    const ip = await clientIp();
    if (!(await rateLimit(`lead:${ip}`, LIMITS.lead.limit, LIMITS.lead.window))) return ok(null);
    const cart = await findCart(await getCartToken());
    if (cart?.items.length) await upsertLead(cart, cleanFields(parsed.data), "checkout");
    return ok(null);
  } catch (err) {
    return handle(err);
  }
}

export async function placeOrderAction(input: unknown): Promise<Result<{ orderNo: string; next: string; external: boolean }>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const data = parsed.data;
  try {
    await connectDB();
    const ip = await clientIp();
    if (!(await rateLimit(`checkout:${ip}`, LIMITS.checkout.limit, LIMITS.checkout.window))) {
      return fail("RATE_LIMITED", "Too many order attempts. Please wait a few minutes or call us.");
    }
    let user = await getCurrentUser();
    const contact = cleanFields(data.contact);
    const address = cleanFields(data.address);

    // Optional account creation for guests.
    if (!user && data.createAccount) {
      if (await UserModel.exists({ email: contact.email })) {
        return fail("CONFLICT", "An account with this email already exists.", { "contact.email": "An account with this email already exists. Log in, or untick “Create an account”." });
      }
      const created = await UserModel.create({ name: contact.name, email: contact.email, phone: contact.phone, passwordHash: await hashPassword(data.password), role: "customer" });
      await createSession(String(created._id));
      user = { id: String(created._id), name: created.name, email: created.email, phone: created.phone, role: "customer" };
    }

    const { order, slugs } = await placeOrder(
      { cartToken: await getCartToken(), userId: user?.id, contact, address, paymentMethod: data.paymentMethod, couponCode: data.couponCode || null, note: cleanText(data.note, { multiline: true }) },
      await rules(),
    );

    if (user && (data.saveAddress || data.createAccount)) {
      const u = await UserModel.findById(user.id).select("addresses").lean();
      const exists = u?.addresses.some((a) => a.addressLine === address.addressLine && a.upazila === address.upazila);
      if (!exists) await UserModel.updateOne({ _id: user.id }, { $push: { addresses: { ...address, label: "Home", isDefault: !u?.addresses.length } } });
    }

    (await cookies()).delete(CART_COOKIE);
    for (const slug of slugs) revalidateTag(`product:${slug}`, { expire: 0 });
    revalidateTag(CATALOG_TAG, "max");

    // Card payments notify once the gateway answers (payment callbacks); everything else notifies now.
    if (order.paymentMethod !== "sslcommerz") after(() => notifyOrderPlaced(order.orderNo));
    if (order.paymentMethod === "sslcommerz") {
      try {
        const url = await initPayment(gatewayOrder(order));
        return ok({ orderNo: order.orderNo, next: url, external: true });
      } catch (err) {
        console.error("SSLCommerz init failed", err);
        after(() => notifyOrderPlaced(order.orderNo)); // the gateway never started, so tell the customer now
        return ok({ orderNo: order.orderNo, next: payUrl(order.orderNo, "&status=unavailable"), external: false });
      }
    }
    const next = order.paymentMethod === "cod" ? orderUrl(order.orderNo, "&placed=1") : payUrl(order.orderNo);
    return ok({ orderNo: order.orderNo, next, external: false });
  } catch (err) {
    return handle(err, "We couldn't place your order. Nothing was charged. Please try again.");
  }
}

async function ownedOrder(orderNo: string, key: string | undefined) {
  const order = await OrderModel.findOne({ orderNo }).lean();
  if (!order) return null;
  if (verifyOrderKey(orderNo, key)) return order;
  const user = await getCurrentUser();
  return user && String(order.user) === user.id ? order : null;
}

/** bKash / Nagad: the customer submits the transaction ID; an admin verifies it. */
export async function submitManualPayment(input: unknown): Promise<Result<{ next: string }>> {
  const parsed = manualPaymentSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await connectDB();
    const { orderNo, key, trxId, senderNumber } = parsed.data;
    const order = await ownedOrder(orderNo, key);
    if (!order) return fail("NOT_FOUND", "Order not found.");
    if (!["bkash", "nagad"].includes(order.paymentMethod)) return fail("VALIDATION", "This order isn't paid by bKash or Nagad.");
    if (order.paymentStatus === "paid") return ok({ next: orderUrl(orderNo) });
    const dupe = await OrderModel.exists({ "payment.trxId": trxId, orderNo: { $ne: orderNo } });
    if (dupe) return fail("CONFLICT", "This transaction ID was already used for another order.", { trxId: "This transaction ID was already used." });
    await OrderModel.updateOne(
      { orderNo, status: "pending" },
      { "payment.trxId": trxId, "payment.senderNumber": senderNumber, "payment.submittedAt": new Date(), $push: { statusHistory: { status: "pending", at: new Date(), note: `${order.paymentMethod === "bkash" ? "bKash" : "Nagad"} Trx ID ${trxId} submitted, awaiting verification` } } },
    );
    return ok({ next: orderUrl(orderNo, "&submitted=1") });
  } catch (err) {
    return handle(err);
  }
}

export async function retryOnlinePayment(input: { orderNo: string; key: string }): Promise<Result<{ next: string }>> {
  try {
    await connectDB();
    const order = await ownedOrder(input.orderNo, input.key);
    if (!order || order.status !== "pending" || order.paymentStatus === "paid") return fail("CONFLICT", "This order can't be paid online any more.");
    await OrderModel.updateOne({ orderNo: order.orderNo }, { paymentMethod: "sslcommerz", paymentStatus: "unpaid" });
    const url = await initPayment(gatewayOrder(order));
    return ok({ next: url });
  } catch (err) {
    return handle(err, "Online payment is unavailable right now. Choose cash on delivery or try again later.");
  }
}

export async function switchToCod(input: { orderNo: string; key: string }): Promise<Result<{ next: string }>> {
  try {
    await connectDB();
    const order = await ownedOrder(input.orderNo, input.key);
    if (!order || order.status !== "pending" || order.paymentStatus === "paid") return fail("CONFLICT", "This order can't be changed any more.");
    const settings = await getSettings();
    if (!settings.payments.cod) return fail("VALIDATION", "Cash on delivery isn't available right now.");
    await OrderModel.updateOne(
      { orderNo: order.orderNo },
      { paymentMethod: "cod", paymentStatus: "unpaid", $push: { statusHistory: { status: "pending", at: new Date(), note: "Customer switched to cash on delivery" } } },
    );
    return ok({ next: orderUrl(order.orderNo) });
  } catch (err) {
    return handle(err);
  }
}

export async function cancelMyOrder(input: { orderNo: string; key?: string }): Promise<Result<null>> {
  try {
    await connectDB();
    const order = await ownedOrder(input.orderNo, input.key);
    if (!order) return fail("NOT_FOUND", "Order not found.");
    await cancelOrder(order.orderNo, "customer");
    revalidateTag(CATALOG_TAG, "max");
    return ok(null);
  } catch (err) {
    return handle(err);
  }
}

export async function trackOrder(input: unknown): Promise<Result<{ next: string }>> {
  const parsed = trackSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  await connectDB();
  const ip = await clientIp();
  if (!(await rateLimit(`track:${ip}`, 20, 15 * 60))) return fail("RATE_LIMITED", "Too many attempts. Please wait a few minutes.");
  const { orderNo, phone } = parsed.data;
  const order = await OrderModel.findOne({ orderNo, $or: [{ "customer.phone": phone }, { "shippingAddress.phone": phone }] }).select("orderNo").lean();
  if (!order) return fail("NOT_FOUND", "We couldn't find an order with this number and phone.");
  return ok({ next: `/order/${orderNo}?key=${orderKey(orderNo)}` });
}
