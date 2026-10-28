// SMS adapter. SMS_PROVIDER=log (default) prints the message; sslwireless / bulksmsbd send through the gateway APIs.
// Request formats follow each provider's public API docs; confirm against your account's docs before going live.
export type SmsMessage = { to: string; text: string; ref?: string };
export type SmsResult = { provider: string; status: "sent" | "logged"; id?: string };

export interface SmsProvider {
  name: string;
  send(msg: SmsMessage): Promise<SmsResult>;
}

/** 01XXXXXXXXX / +8801… → 8801XXXXXXXXX, the format both gateways expect. */
export function toMsisdn(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const local = digits.replace(/^880?(?=1)/, "").replace(/^(?=1\d{9}$)/, "0");
  if (!/^01[3-9]\d{8}$/.test(local)) throw new Error(`Not a Bangladeshi mobile number: ${phone}`);
  return `88${local}`;
}

const TIMEOUT = 10_000;

const logProvider: SmsProvider = {
  name: "log",
  async send(msg) {
    console.log(`\n📱 [sms:log] to=${msg.to}\n${msg.text}\n`);
    return { provider: "log", status: "logged" };
  },
};

// SSL Wireless ISMS API v3: JSON POST, success when status_code 200 and the SMS status is SUCCESS.
const sslWireless: SmsProvider = {
  name: "sslwireless",
  async send(msg) {
    const { SSLWIRELESS_API_TOKEN: token, SSLWIRELESS_SID: sid } = process.env;
    if (!token || !sid) throw new Error("SMS_PROVIDER=sslwireless needs SSLWIRELESS_API_TOKEN and SSLWIRELESS_SID.");
    const res = await fetch("https://smsplus.sslwireless.com/api/v3/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ api_token: token, sid, msisdn: toMsisdn(msg.to), sms: msg.text, csms_id: (msg.ref ?? `ov${Date.now()}`).slice(0, 20) }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = (await res.json().catch(() => null)) as { status_code?: number; error_message?: string; smsinfo?: { sms_status?: string; reference_id?: string }[] } | null;
    const info = data?.smsinfo?.[0];
    if (!res.ok || data?.status_code !== 200 || info?.sms_status !== "SUCCESS") {
      throw new Error(`SSL Wireless rejected the SMS: ${data?.error_message || info?.sms_status || `HTTP ${res.status}`}`);
    }
    return { provider: "sslwireless", status: "sent", id: info.reference_id };
  },
};

// BulkSMSBD: form POST, success when response_code is 202.
const bulkSmsBd: SmsProvider = {
  name: "bulksmsbd",
  async send(msg) {
    const { BULKSMSBD_API_KEY: key, BULKSMSBD_SENDER_ID: sender } = process.env;
    if (!key || !sender) throw new Error("SMS_PROVIDER=bulksmsbd needs BULKSMSBD_API_KEY and BULKSMSBD_SENDER_ID.");
    const res = await fetch("https://bulksmsbd.net/api/smsapi", {
      method: "POST",
      body: new URLSearchParams({ api_key: key, senderid: sender, number: toMsisdn(msg.to), message: msg.text, type: "text" }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = (await res.json().catch(() => null)) as { response_code?: number; message_id?: number | string; error_message?: string } | null;
    if (data?.response_code !== 202) throw new Error(`BulkSMSBD rejected the SMS: ${data?.error_message || `code ${data?.response_code ?? res.status}`}`);
    return { provider: "bulksmsbd", status: "sent", id: data.message_id ? String(data.message_id) : undefined };
  },
};

export function getSmsProvider(): SmsProvider {
  const p = process.env.SMS_PROVIDER;
  return p === "sslwireless" ? sslWireless : p === "bulksmsbd" ? bulkSmsBd : logProvider;
}
