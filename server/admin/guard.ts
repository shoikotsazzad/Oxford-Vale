import "server-only";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import type { z } from "zod";
import { getCurrentUser, isAdminRole, type SessionUser } from "@/server/auth/session";
import { can, type Permission } from "@/server/auth/rbac";
import { connectDB } from "@/server/db";
import { fail, fromZod, type Result } from "@/server/result";
import { OrderError } from "@/server/services/order";
import { ProductAdminError } from "@/server/services/product-admin";
import { UploadError } from "@/server/storage";

/** Admin page guard: login page if signed out / not staff, dashboard if the role lacks the permission. */
export async function requireAdminPage(perm: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) redirect("/admin/login");
  if (!can(user.role, perm)) redirect(`/admin?denied=${encodeURIComponent(perm)}`);
  await connectDB();
  return user;
}

/** Route-handler guard (CSV exports, invoices). Returns null when not allowed. */
export async function adminFromRequest(perm: Permission): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  return user && isAdminRole(user.role) && can(user.role, perm) ? user : null;
}

/** Wraps every admin server action: session + permission check, zod parse, error mapping. */
export async function adminAction<S extends z.ZodType, T>(
  perm: Permission,
  schema: S,
  input: unknown,
  fn: (data: z.infer<S>, admin: SessionUser) => Promise<Result<T>>,
): Promise<Result<T>> {
  const admin = await getCurrentUser();
  if (!admin || !isAdminRole(admin.role)) return fail("UNAUTHORIZED", "Please sign in again.");
  if (!can(admin.role, perm)) return fail("FORBIDDEN", "Your role can't make this change.");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await connectDB();
    return await fn(parsed.data, admin);
  } catch (err) {
    if (err instanceof OrderError) return fail(err.code, err.message, err.fields);
    if (err instanceof AdminError) return fail(err.code, err.message, err.fields);
    if (err instanceof ProductAdminError) return fail("VALIDATION", err.message, err.fields);
    if (err instanceof UploadError) return fail("VALIDATION", err.message);
    if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
      const field = Object.keys(err.keyPattern ?? {})[0] ?? "_";
      return fail("CONFLICT", `This ${field} is already in use.`, { [field]: "Already in use." });
    }
    console.error("[admin action]", err);
    return fail("SERVER_ERROR", "Something went wrong. Please try again.");
  }
}

export class AdminError extends Error {
  constructor(public code: "VALIDATION" | "NOT_FOUND" | "CONFLICT" | "FORBIDDEN", message: string, public fields?: Record<string, string>) {
    super(message);
  }
}
