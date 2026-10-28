"use server";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { connectDB } from "@/server/db";
import { CartModel, PasswordResetTokenModel, UserModel } from "@/models";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createSession, destroySession, revokeUserSessions } from "@/server/auth/session";
import { getCartToken } from "@/server/cart-cookie";
import { randomToken, sha256 } from "@/server/crypto";
import { clientIp, LIMITS, rateLimit } from "@/server/rate-limit";
import { cleanText } from "@/server/sanitize";
import { fail, fromZod, ok, type Result } from "@/server/result";
import { sendEmail } from "@/server/services/notify";
import { forgotSchema, loginSchema, registerSchema, resetSchema } from "@/lib/validation/auth";
import { site } from "@/data/site";
import { safeNext } from "@/lib/safe-next";

/** Attach the visitor's current bag to their account. */
async function claimCart(userId: string) {
  const token = await getCartToken();
  if (token) await CartModel.updateOne({ cartToken: token, status: "active" }, { user: userId });
}

export async function register(input: unknown): Promise<Result<{ next: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  await connectDB();
  const ip = await clientIp();
  if (!(await rateLimit(`register:${ip}`, LIMITS.register.limit, LIMITS.register.window))) {
    return fail("RATE_LIMITED", "Too many sign-ups from this network. Please try again later.");
  }
  const { email, password, phone } = parsed.data;
  if (await UserModel.exists({ email })) {
    return fail("CONFLICT", "An account with this email already exists.", { email: "An account with this email already exists. Try logging in." });
  }
  const user = await UserModel.create({ name: cleanText(parsed.data.name), email, phone, passwordHash: await hashPassword(password), role: "customer" });
  await createSession(String(user._id));
  await claimCart(String(user._id));
  return ok({ next: safeNext((input as { next?: string }).next) });
}

export async function login(input: unknown): Promise<Result<{ next: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  await connectDB();
  const { email, password } = parsed.data;
  const ip = await clientIp();
  if (!(await rateLimit(`login:${ip}:${email}`, LIMITS.login.limit, LIMITS.login.window))) {
    return fail("RATE_LIMITED", "Too many login attempts. Please wait 15 minutes and try again.");
  }
  const user = await UserModel.findOne({ email, isActive: true }).select("+passwordHash role").lean();
  // Same message for unknown email and wrong password.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return fail("UNAUTHORIZED", "Email or password is incorrect.");
  }
  await createSession(String(user._id));
  await UserModel.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
  await claimCart(String(user._id));
  return ok({ next: safeNext((input as { next?: string }).next) });
}

export async function logout() {
  await connectDB();
  await destroySession();
  redirect("/");
}

export async function forgotPassword(input: unknown): Promise<Result<null>> {
  const parsed = forgotSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  await connectDB();
  const { email } = parsed.data;
  if (!(await rateLimit(`forgot:${email}`, LIMITS.forgotPassword.limit, LIMITS.forgotPassword.window))) {
    return fail("RATE_LIMITED", "Too many reset requests. Please try again in an hour.");
  }
  const user = await UserModel.findOne({ email, isActive: true }).select("name email").lean();
  // Always answer the same way, so the form can't be used to discover accounts.
  if (user) {
    const token = randomToken();
    await PasswordResetTokenModel.create({ user: user._id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60 * 60_000) });
    const link = `${site.url}/account/reset-password/${token}`;
    // After the response: same timing whether or not the account exists.
    after(() =>
      sendEmail(
        { to: user.email, subject: "Reset your Oxford Vale password", text: `Hello ${user.name},\n\nReset your password with this link (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email.\n\nOxford Vale` },
        { type: "user", id: String(user._id) },
      ),
    );
  }
  return ok(null);
}

export async function resetPassword(input: unknown): Promise<Result<{ next: string }>> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  await connectDB();
  const record = await PasswordResetTokenModel.findOneAndUpdate(
    { tokenHash: sha256(parsed.data.token), usedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
    { usedAt: new Date() },
  ).lean();
  if (!record) return fail("NOT_FOUND", "This reset link is invalid or has expired. Please request a new one.");
  await UserModel.updateOne({ _id: record.user }, { passwordHash: await hashPassword(parsed.data.password) });
  await revokeUserSessions(String(record.user));
  await createSession(String(record.user));
  return ok({ next: "/account" });
}
