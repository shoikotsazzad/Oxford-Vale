"use server";
import { redirect } from "next/navigation";
import { connectDB } from "@/server/db";
import { UserModel, ADMIN_ROLES } from "@/models";
import { verifyPassword } from "@/server/auth/password";
import { createSession, destroySession } from "@/server/auth/session";
import { clientIp, LIMITS, rateLimit } from "@/server/rate-limit";
import { fail, fromZod, ok, type Result } from "@/server/result";
import { adminLoginSchema } from "@/lib/validation/admin";

const safeAdminNext = (next?: string) => (next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");

export async function adminLogin(input: unknown): Promise<Result<{ next: string }>> {
  const parsed = adminLoginSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  await connectDB();
  const { email, password } = parsed.data;
  if (!(await rateLimit(`admin-login:${await clientIp()}:${email}`, LIMITS.login.limit, LIMITS.login.window))) {
    return fail("RATE_LIMITED", "Too many login attempts. Please wait 15 minutes and try again.");
  }
  const user = await UserModel.findOne({ email, isActive: true, role: { $in: ADMIN_ROLES } }).select("+passwordHash").lean();
  // Same answer for unknown email, customer account and wrong password.
  if (!user || !(await verifyPassword(password, user.passwordHash))) return fail("UNAUTHORIZED", "Email or password is incorrect.");
  await createSession(String(user._id));
  await UserModel.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
  return ok({ next: safeAdminNext(parsed.data.next) });
}

export async function adminLogout() {
  await connectDB();
  await destroySession();
  redirect("/admin/login");
}
