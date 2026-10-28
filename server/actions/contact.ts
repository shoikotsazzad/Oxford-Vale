"use server";
import { after } from "next/server";
import { notifyContactMessage } from "@/server/notifications";
import { connectDB } from "@/server/db";
import { ContactMessageModel } from "@/models/ContactMessage";
import { contactSchema } from "@/lib/validation/contact";
import { cleanFields } from "@/server/sanitize";
import { clientIp, LIMITS, rateLimit } from "@/server/rate-limit";
import { fail, fromZod, ok, type Result } from "@/server/result";

export async function sendContactMessage(input: unknown): Promise<Result<{ id: string }>> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  if (parsed.data.website) return ok({ id: "" }); // honeypot: pretend success

  try {
    await connectDB();
    const ip = await clientIp();
    if (!(await rateLimit(`contact:${ip}`, LIMITS.contact.limit, LIMITS.contact.window))) {
      return fail("RATE_LIMITED", "Too many messages. Please try again in an hour, or call us.");
    }
    const { name, email, phone, subject, message } = cleanFields(parsed.data, ["message"]);
    const doc = await ContactMessageModel.create({ name, email, phone, subject, message, ip });
    after(() => notifyContactMessage(String(doc._id)));
    return ok({ id: String(doc._id) });
  } catch (err) {
    console.error("contact message failed", err);
    return fail("SERVER_ERROR", "We couldn't send your message. Please try again or call us.");
  }
}
