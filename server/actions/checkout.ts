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
import { cancelOrder, isPaymentEnabled, OrderError, placeOrder, priceCart, quote, type Quote, type StoreRules } from "@/server/services/order";
import { startPayment, type GatewayOrder } from "@/server/adapters/payments";
import { payUrl } from "@/server/services/payment-redirect";
import { checkoutSchema, trackSchema } from "@/lib/validation/checkout";
import { leadSchema } from "@/lib/validation/cart";
import { normalizePhone } from "@/lib/phone";
import { PAYMENT_METHODS, type PaymentMethod } from "@/models/enums";
import { CATALOG_TAG } from "@/server/services/catalog";

const gatewayOrder = (o: Pick<Order, "orderNo" | "total" | "customer">): GatewayOrder => ({
  orderNo: o.orderNo,
  total: o.total,
  email: o.customer?.email ?? "",
  name: o.customer?.name ?? "",
});

/** Send the shopper to Stripe / PayPal; remember the provider session on the order. */
async function beginPayment(method: PaymentMethod, order: Pick<Order, "orderNo" | "total" | "customer">) {
  const { url, sessionId } = await startPayment(method, gatewayOrder(order));
  await OrderModel.updateOne({ orderNo: order.orderNo }, { paymentMethod: method, paymentStatus: "unpaid", "payment.sessionId": sessionId });
  return url;
}

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

/** Live order summary while the shopper fills in the form: delivery options for the country, fees and coupon. */
export async function getCheckoutQuote(input: { country?: string; deliveryOption?: string; couponCode?: string; phone?: string }): Promise<Result<QuoteResult>> {
  try {
    await connectDB();
    const { lines, problems } = await priceCart(await getCartToken());
    const country = /^[A-Z]{2}$/.test(input.country ?? "") ? input.country! : null;
    const { coupon: _c, ...q } = await quote(lines, await rules(), {
      delivery: country ? { country, optionId: input.deliveryOption } : null,
      couponCode: input.couponCode?.slice(0, 30),
      phone: input.phone ? normalizePhone(input.phone) : undefined,
    });
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
      { cartToken: await getCartToken(), userId: user?.id, contact, address, deliveryOption: data.deliveryOption, paymentMethod: data.paymentMethod, couponCode: data.couponCode || null, note: cleanText(data.note, { multiline: true }) },
      await rules(),
    );

    if (user && (data.saveAddress || data.createAccount)) {
      const u = await UserModel.findById(user.id).select("addresses").lean();
      const exists = u?.addresses.some((a) => a.line1 === address.line1 && a.postcode === address.postcode && a.country === address.country);
      if (!exists) await UserModel.updateOne({ _id: user.id }, { $push: { addresses: { ...address, label: "Home", isDefault: !u?.addresses.length } } });
    }

    (await cookies()).delete(CART_COOKIE);
    for (const slug of slugs) revalidateTag(`product:${slug}`, { expire: 0 });
    revalidateTag(CATALOG_TAG, "max");

    // Every order is paid online: the confirmation email goes out once the provider answers (payment routes).
    try {
      const url = await beginPayment(order.paymentMethod, order);
      return ok({ orderNo: order.orderNo, next: url, external: true });
    } catch (err) {
      console.error(`${order.paymentMethod} payment start failed`, err);
      after(() => notifyOrderPlaced(order.orderNo)); // the provider never started, so tell the customer now
      return ok({ orderNo: order.orderNo, next: payUrl(order.orderNo, "&status=unavailable"), external: false });
    }
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

/** From the pay page: try again, with the same or the other provider. */
export async function retryOnlinePayment(input: { orderNo: string; key: string; method: string }): Promise<Result<{ next: string }>> {
  try {
    await connectDB();
    const method = PAYMENT_METHODS.find((m) => m === input.method);
    if (!method) return fail("VALIDATION", "Choose a payment method.");
    const order = await ownedOrder(input.orderNo, input.key);
    if (!order || order.status !== "pending" || order.paymentStatus === "paid") return fail("CONFLICT", "This order can't be paid online any more.");
    if (!isPaymentEnabled(method, await rules())) return fail("VALIDATION", "This payment method isn't available right now.");
    return ok({ next: await beginPayment(method, order) });
  } catch (err) {
    return handle(err, "Online payment is unavailable right now. Please try again in a few minutes or contact us.");
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
  const { orderNo, contact } = parsed.data;
  // Phone (any format) or email, as used at checkout.
  const match = contact.includes("@")
    ? [{ "customer.email": contact.toLowerCase() }]
    : [{ "customer.phone": normalizePhone(contact) }, { "shippingAddress.phone": normalizePhone(contact) }];
  const order = await OrderModel.findOne({ orderNo, $or: match }).select("orderNo").lean();
  if (!order) return fail("NOT_FOUND", "We couldn't find an order with this number and phone or email.");
  return ok({ next: `/order/${orderNo}?key=${orderKey(orderNo)}` });
}
