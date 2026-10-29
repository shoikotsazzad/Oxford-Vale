"use server";
import { connectDB } from "@/server/db";
import { getCartToken, setCartToken } from "@/server/cart-cookie";
import { addItem, buildCartView, CartError, findCart, markLeadSkipped, setItemQty } from "@/server/services/cart";
import { upsertLead } from "@/server/services/lead";
import { getSettings } from "@/server/services/settings";
import { getCurrentUser } from "@/server/auth/session";
import { CartModel } from "@/models";
import { cleanFields } from "@/server/sanitize";
import { clientIp, LIMITS, rateLimit } from "@/server/rate-limit";
import { fail, fromZod, ok, type Result } from "@/server/result";
import { addToCartSchema, leadSchema, updateQtySchema } from "@/lib/validation/cart";
import type { CartView } from "@/lib/types";

async function view(token: string | undefined): Promise<CartView> {
  const settings = await getSettings();
  return buildCartView(await findCart(token), settings.freeDeliveryThreshold);
}

function handle(err: unknown) {
  if (err instanceof CartError) return fail(err.code, err.message);
  console.error("cart action failed", err);
  return fail("SERVER_ERROR", "Something went wrong with your bag. Please try again.");
}

export async function getCart(): Promise<Result<CartView>> {
  try {
    await connectDB();
    return ok(await view(await getCartToken()));
  } catch (err) {
    return handle(err);
  }
}

export async function addToCart(input: unknown): Promise<Result<CartView>> {
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await connectDB();
    const current = await getCartToken();
    const { token, cart } = await addItem(current, parsed.data.variantId, parsed.data.qty);
    if (token !== current) await setCartToken(token);
    // Signed-in shoppers: link the bag and record the lead from their profile (no modal needed).
    // Accounts without a phone (e.g. staff) get the lead at checkout instead; a lead problem never blocks the bag.
    const user = await getCurrentUser();
    if (user && !cart.lead) {
      await CartModel.updateOne({ _id: cart._id }, { user: user.id });
      if (user.phone) {
        await upsertLead({ ...cart, user: user.id as unknown as typeof cart.user }, { name: user.name, phone: user.phone, email: user.email }, "add_to_cart").catch((err) => console.error("lead from profile failed", err));
      }
    }
    return ok(await view(token));
  } catch (err) {
    return handle(err);
  }
}

export async function updateCartQty(input: unknown): Promise<Result<CartView>> {
  const parsed = updateQtySchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await connectDB();
    const token = await getCartToken();
    await setItemQty(token, parsed.data.variantId, parsed.data.qty);
    return ok(await view(token));
  } catch (err) {
    return handle(err);
  }
}

export async function removeFromCart(variantId: string): Promise<Result<CartView>> {
  return updateCartQty({ variantId, qty: 0 });
}

/** Lead form shown on first add-to-cart. */
export async function submitLead(input: unknown): Promise<Result<CartView>> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await connectDB();
    const ip = await clientIp();
    if (!(await rateLimit(`lead:${ip}`, LIMITS.lead.limit, LIMITS.lead.window))) {
      return fail("RATE_LIMITED", "Too many attempts. Please try again later.");
    }
    const token = await getCartToken();
    const cart = await findCart(token);
    if (!cart) return fail("NOT_FOUND", "Your bag has expired. Please add the item again.");
    await upsertLead(cart, cleanFields(parsed.data), "add_to_cart");
    return ok(await view(token));
  } catch (err) {
    return handle(err);
  }
}

export async function skipLead(): Promise<Result<CartView>> {
  try {
    await connectDB();
    const token = await getCartToken();
    await markLeadSkipped(token);
    return ok(await view(token));
  } catch (err) {
    return handle(err);
  }
}
