// Sends email through the configured adapter and records every message in NotificationLog,
// so mocked messages are visible in admin → Messages. Failures are logged, never thrown to the shopper.
import { NotificationLogModel } from "@/models/NotificationLog";
import { getEmailProvider, type EmailMessage } from "@/server/adapters/email";

type Ref = { type: string; id: string };

/** Secrets in links (password reset tokens, signed order keys) never go into the log admins can read. */
export const redact = (text: string) => text.replace(/(\/reset-password\/)[\w-]+/g, "$1[hidden]").replace(/([?&]key=)[\w-]+/g, "$1[hidden]");

/** With an event name, a message already sent (or logged) for the same ref, channel and recipient is skipped. */
async function alreadySent(channel: "email", to: string, ref?: Ref, event?: string) {
  if (!event || !ref) return false;
  return Boolean(await NotificationLogModel.exists({ channel, to, event, "ref.id": ref.id, status: { $in: ["sent", "logged"] } }));
}

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err)).slice(0, 500);

export async function sendEmail(msg: EmailMessage, ref?: Ref, event?: string) {
  if (!msg.to) return false;
  if (await alreadySent("email", msg.to, ref, event)) return true;
  const provider = getEmailProvider();
  const base = { channel: "email" as const, to: msg.to, subject: msg.subject, body: redact(msg.text), ref, event };
  try {
    const res = await provider.send(msg);
    await NotificationLogModel.create({ ...base, provider: res.provider, status: res.status });
    return true;
  } catch (err) {
    console.error("email failed", err);
    await NotificationLogModel.create({ ...base, provider: provider.name, status: "failed", error: errorText(err) }).catch(() => {});
    return false;
  }
}
