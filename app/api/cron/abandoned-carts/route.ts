import type { NextRequest } from "next/server";
import { connection } from "next/server";
import { connectDB } from "@/server/db";
import { runAbandonedSweep } from "@/server/services/abandoned";

// Vercel Cron sends "Authorization: Bearer <CRON_SECRET>".
export async function GET(request: NextRequest) {
  await connection();
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: { code: "UNAUTHORIZED", message: "Invalid cron secret." } }, { status: 401 });
  }
  try {
    await connectDB();
    const { minutes, abandoned, notified } = await runAbandonedSweep();
    return Response.json({ ok: true, data: { minutes, abandoned, notified } });
  } catch (err) {
    console.error("abandoned sweep failed", err);
    return Response.json({ ok: false, error: { code: "SERVER_ERROR", message: "Sweep failed." } }, { status: 500 });
  }
}
