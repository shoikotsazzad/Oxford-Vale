import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { connection } from "next/server";
import { connectDB } from "@/server/db";
import { SessionModel, UserModel, type Role, ADMIN_ROLES } from "@/models";
import { randomToken, sha256 } from "@/server/crypto";

export const SESSION_COOKIE = "ov_session";
const SESSION_DAYS = 30;

export type SessionUser = { id: string; name: string; email: string; phone: string; role: Role };

/** Create a session for the user and set the cookie. Server actions / route handlers only. */
export async function createSession(userId: string) {
  const token = randomToken();
  const h = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await SessionModel.create({ tokenHash: sha256(token), user: userId, expiresAt, userAgent: h.get("user-agent")?.slice(0, 200), ip: h.get("x-forwarded-for")?.split(",")[0] });
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await SessionModel.deleteOne({ tokenHash: sha256(token) });
  jar.delete(SESSION_COOKIE);
}

/** Current user from the session cookie (once per request). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  await connection(); // per-request: compares the session expiry with the current time
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  await connectDB();
  const session = await SessionModel.findOne({ tokenHash: sha256(token), expiresAt: { $gt: new Date() } }).select("user").lean();
  if (!session) return null;
  const user = await UserModel.findOne({ _id: session.user, isActive: true }).select("name email phone role").lean();
  if (!user) return null;
  return { id: String(user._id), name: user.name, email: user.email, phone: user.phone ?? "", role: user.role };
});

export const isAdminRole = (role: Role) => ADMIN_ROLES.includes(role);

/** Revoke every session of a user (password reset, deactivation). */
export async function revokeUserSessions(userId: string) {
  await SessionModel.deleteMany({ user: userId });
}
