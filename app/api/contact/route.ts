import { validateContact } from "@/lib/validate";
import { connectDB, dbEnabled } from "@/lib/db";

// Light in-memory rate limit: 5 requests per IP per 10 minutes.
const hits = new Map<string, number[]>();
const WINDOW = 10 * 60 * 1000;
const LIMIT = 5;

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (limited(ip)) {
    return Response.json({ ok: false, error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const result = validateContact(body);
  if (!result.ok) return Response.json({ ok: false, errors: result.errors }, { status: 400 });

  let saved = false;
  if (dbEnabled()) {
    try {
      await connectDB();
      const { LeadModel } = await import("@/models/Lead");
      await LeadModel.create(result.data);
      saved = true;
    } catch (err) {
      console.error("Lead save failed", err);
      return Response.json({ ok: false, error: "Could not save your message. Please use WhatsApp." }, { status: 500 });
    }
  }

  return Response.json({ ok: true, saved });
}
