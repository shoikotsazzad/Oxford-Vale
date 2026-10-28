import "server-only";
import { headers } from "next/headers";
import { RateLimitModel } from "@/models/RateLimit";

/**
 * Fixed-window rate limit stored in MongoDB (works across serverless instances).
 * Returns true when the call is allowed.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = Date.now();
  const windowStart = Math.floor(now / (windowSeconds * 1000));
  const id = `${key}:${windowStart}`;
  const doc = await RateLimitModel.findOneAndUpdate(
    { key: id },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((windowStart + 1) * windowSeconds * 1000) } },
    { upsert: true, returnDocument: "after" },
  ).lean();
  return (doc?.count ?? 0) <= limit;
}

/** Best-effort client IP (Vercel / proxies set x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export const LIMITS = {
  login: { limit: 5, window: 15 * 60 },
  register: { limit: 5, window: 60 * 60 },
  checkout: { limit: 10, window: 10 * 60 },
  contact: { limit: 5, window: 60 * 60 },
  forgotPassword: { limit: 3, window: 60 * 60 },
  lead: { limit: 20, window: 60 * 60 },
} as const;
