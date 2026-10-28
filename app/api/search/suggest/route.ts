import type { NextRequest } from "next/server";
import { suggestProducts } from "@/server/services/catalog";

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  try {
    const data = await suggestProducts(q);
    return Response.json({ ok: true, data }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch {
    return Response.json({ ok: false, error: { code: "SEARCH_FAILED", message: "Search is unavailable right now." } }, { status: 500 });
  }
}
