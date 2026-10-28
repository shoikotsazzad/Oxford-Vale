import "server-only";
import { connection } from "next/server";
import { connectDB } from "./db";

/**
 * For per-request pages (orders, account): mark the render as request-time, then connect.
 * Database calls read the clock, which Next.js forbids while prerendering. Don't use inside "use cache".
 */
export async function requestDB() {
  await connection();
  return connectDB();
}
