// Email adapter. EMAIL_PROVIDER=log (default) prints the message; smtp sends through nodemailer.
import nodemailer, { type Transporter } from "nodemailer";

export type EmailMessage = { to: string; subject: string; text: string; html?: string; replyTo?: string };
export type EmailResult = { provider: string; status: "sent" | "logged"; id?: string };

export interface EmailProvider {
  name: string;
  send(msg: EmailMessage): Promise<EmailResult>;
}

const logProvider: EmailProvider = {
  name: "log",
  async send(msg) {
    console.log(`\n✉️  [email:log] to=${msg.to} subject="${msg.subject}"\n${msg.text}\n`);
    return { provider: "log", status: "logged" };
  },
};

let transport: Transporter | null = null;

const smtpProvider: EmailProvider = {
  name: "smtp",
  async send(msg) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
    if (!SMTP_HOST || !EMAIL_FROM) throw new Error("EMAIL_PROVIDER=smtp needs SMTP_HOST and EMAIL_FROM.");
    const port = Number(SMTP_PORT) || 587;
    transport ??= nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465, // 587/25 upgrade with STARTTLS
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    const info = await transport.sendMail({ from: EMAIL_FROM, to: msg.to, subject: msg.subject, text: msg.text, html: msg.html, replyTo: msg.replyTo });
    return { provider: "smtp", status: "sent", id: info.messageId };
  },
};

export function getEmailProvider(): EmailProvider {
  return process.env.EMAIL_PROVIDER === "smtp" ? smtpProvider : logProvider;
}
