// Message templates (pure: no DB, no env), so they are easy to test and preview.
// Emails have a plain-text body (always) and a simple inline-styled HTML body. SMS stay under ~2 parts in English.
import { formatBDT } from "@/lib/money";

export type Store = { name: string; phone: string; whatsapp: string; email: string; url: string; bkash: string; nagad: string };
export type OrderLine = { name: string; size?: string | null; colour?: string | null; qty: number; lineTotal: number };
export type OrderInfo = {
  orderNo: string; customerName: string; phone: string; email: string; items: OrderLine[];
  subtotal: number; discount: number; couponCode?: string | null; deliveryName: string; deliveryFee: number; total: number;
  paymentMethod: "cod" | "sslcommerz" | "bkash" | "nagad"; paymentStatus: string; etaMin: number; etaMax: number;
  address: string; note?: string; link: string; adminLink: string; courier?: string; trackingNo?: string;
};
export type Email = { subject: string; text: string; html: string };

const METHOD = { cod: "Cash on delivery", sslcommerz: "Card / mobile banking (SSLCommerz)", bkash: "bKash", nagad: "Nagad" } as const;
// Plain "Tk" in SMS: ৳ forces Unicode SMS (70 chars per part instead of 160).
const tk = (n: number) => `Tk ${new Intl.NumberFormat("en-IN").format(n)}`;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const variant = (l: OrderLine) => [l.size && l.size !== "One Size" ? l.size : "", l.colour].filter(Boolean).join(", ");

/** Branded wrapper: wordmark, content, footer with contact details. */
function layout(store: Store, title: string, body: string, cta?: { label: string; href: string }) {
  return `<!doctype html><html><body style="margin:0;background:#F7F5F0;font-family:Arial,Helvetica,sans-serif;color:#111111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F0;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #E2DDD3;border-radius:8px">
<tr><td style="padding:28px 28px 8px;font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:3px">${esc(store.name.toUpperCase())}</td></tr>
<tr><td style="padding:8px 28px 0"><h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:24px">${esc(title)}</h1></td></tr>
<tr><td style="padding:16px 28px 8px;font-size:14px;line-height:1.6">${body}</td></tr>
${cta ? `<tr><td style="padding:8px 28px 28px"><a href="${esc(cta.href)}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-size:12px;letter-spacing:2px;text-transform:uppercase">${esc(cta.label)}</a></td></tr>` : ""}
</table>
<p style="max-width:560px;font-size:12px;color:#7A746B;line-height:1.6;margin:16px auto 0">${esc(store.name)} · ${esc(store.phone)} · WhatsApp ${esc(store.whatsapp)} · <a href="mailto:${esc(store.email)}" style="color:#7A746B">${esc(store.email)}</a></p>
</td></tr></table></body></html>`;
}

function itemsHtml(o: OrderInfo) {
  const rows = o.items
    .map((l) => `<tr><td style="padding:6px 0;border-bottom:1px solid #E2DDD3">${esc(l.name)}${variant(l) ? `<br><span style="color:#7A746B;font-size:12px">${esc(variant(l))}</span>` : ""}</td><td style="padding:6px 0;border-bottom:1px solid #E2DDD3;text-align:center">${l.qty}</td><td style="padding:6px 0;border-bottom:1px solid #E2DDD3;text-align:right">${formatBDT(l.lineTotal)}</td></tr>`)
    .join("");
  const line = (label: string, value: string, bold = false) => `<tr><td colspan="2" style="padding:4px 0;${bold ? "font-weight:bold" : "color:#7A746B"}">${esc(label)}</td><td style="padding:4px 0;text-align:right;${bold ? "font-weight:bold" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:12px 0">${rows}
${line("Subtotal", formatBDT(o.subtotal))}${o.discount ? line(`Discount${o.couponCode ? ` (${o.couponCode})` : ""}`, `−${formatBDT(o.discount)}`) : ""}
${line(`Delivery · ${o.deliveryName}`, o.deliveryFee ? formatBDT(o.deliveryFee) : "Free")}${line("Total", formatBDT(o.total), true)}</table>`;
}

function itemsText(o: OrderInfo) {
  return [
    ...o.items.map((l) => `- ${l.qty} × ${l.name}${variant(l) ? ` (${variant(l)})` : ""}: ${formatBDT(l.lineTotal)}`),
    `Subtotal: ${formatBDT(o.subtotal)}`,
    ...(o.discount ? [`Discount${o.couponCode ? ` (${o.couponCode})` : ""}: −${formatBDT(o.discount)}`] : []),
    `Delivery (${o.deliveryName}): ${o.deliveryFee ? formatBDT(o.deliveryFee) : "Free"}`,
    `Total: ${formatBDT(o.total)}`,
  ].join("\n");
}

function nextStep(o: OrderInfo, store: Store) {
  if (o.paymentStatus === "paid") return "Your payment is received. We'll call you before dispatch.";
  if (o.paymentMethod === "cod") return `Pay ${formatBDT(o.total)} in cash when your order arrives. We'll call you to confirm before dispatch.`;
  if (o.paymentMethod === "bkash" || o.paymentMethod === "nagad") {
    const label = METHOD[o.paymentMethod];
    const number = o.paymentMethod === "bkash" ? store.bkash : store.nagad;
    return `Send ${formatBDT(o.total)} with ${label} (Send Money) to ${number}, then enter the transaction ID on your order page. We confirm the order once we've checked the payment.`;
  }
  return "Your order is reserved. If the online payment didn't go through, you can try again or switch to cash on delivery from your order page.";
}

export function orderPlacedEmail(o: OrderInfo, store: Store): Email {
  const step = nextStep(o, store);
  const eta = `Estimated delivery: ${o.etaMin}–${o.etaMax} working days to ${o.address}.`;
  return {
    subject: `Order ${o.orderNo} received: thank you, ${o.customerName.split(" ")[0]}`,
    text: `Hello ${o.customerName},\n\nThank you for your order ${o.orderNo}.\n\n${itemsText(o)}\n\nPayment: ${METHOD[o.paymentMethod]}\n${step}\n${eta}\n\nView or track your order: ${o.link}\n\nQuestions? Reply to this email, call ${store.phone} or WhatsApp ${store.whatsapp}.\n\n${store.name}`,
    html: layout(
      store,
      "Thank you for your order",
      `<p style="margin:0 0 8px">Hello ${esc(o.customerName)},</p><p style="margin:0 0 8px">We've received your order <strong>${esc(o.orderNo)}</strong>.</p>${itemsHtml(o)}
<p style="margin:0 0 8px"><strong>Payment:</strong> ${esc(METHOD[o.paymentMethod])}<br>${esc(step)}</p><p style="margin:0;color:#7A746B">${esc(eta)}</p>`,
      { label: "View your order", href: o.link },
    ),
  };
}

export function orderPlacedSms(o: OrderInfo, store: Store) {
  const pay =
    o.paymentStatus === "paid" ? "Paid." :
    o.paymentMethod === "cod" ? `Pay ${tk(o.total)} on delivery.` :
    o.paymentMethod === "bkash" || o.paymentMethod === "nagad" ? `Send ${tk(o.total)} to ${o.paymentMethod === "bkash" ? `bKash ${store.bkash}` : `Nagad ${store.nagad}`} and submit the TrxID on your order page.` :
    `Total ${tk(o.total)}.`;
  return `${store.name}: order ${o.orderNo} received. ${pay} Track: ${o.link}`;
}

export function paymentReceivedEmail(o: OrderInfo, store: Store): Email {
  return {
    subject: `Payment received for order ${o.orderNo}`,
    text: `Hello ${o.customerName},\n\nWe've received your payment of ${formatBDT(o.total)} (${METHOD[o.paymentMethod]}) for order ${o.orderNo}. Your order is confirmed and we're getting it ready.\n\nTrack your order: ${o.link}\n\n${store.name}`,
    html: layout(
      store,
      "Payment received",
      `<p style="margin:0 0 8px">Hello ${esc(o.customerName)},</p><p style="margin:0">We've received your payment of <strong>${formatBDT(o.total)}</strong> (${esc(METHOD[o.paymentMethod])}) for order <strong>${esc(o.orderNo)}</strong>. Your order is confirmed and we're getting it ready.</p>`,
      { label: "Track your order", href: o.link },
    ),
  };
}

export function orderShippedEmail(o: OrderInfo, store: Store): Email {
  const via = `${o.courier}${o.trackingNo ? ` (tracking number ${o.trackingNo})` : ""}`;
  const cash = o.paymentMethod === "cod" && o.paymentStatus !== "paid" ? `Please keep ${formatBDT(o.total)} ready for the courier.` : "";
  return {
    subject: `Order ${o.orderNo} is on its way`,
    text: `Hello ${o.customerName},\n\nYour order ${o.orderNo} has been shipped with ${via}. Expected in ${o.etaMin}–${o.etaMax} working days.\n${cash}\n\nTrack your order: ${o.link}\n\n${store.name}`,
    html: layout(
      store,
      "Your order is on its way",
      `<p style="margin:0 0 8px">Hello ${esc(o.customerName)},</p><p style="margin:0 0 8px">Order <strong>${esc(o.orderNo)}</strong> has been shipped with ${esc(via)}. Expected in ${o.etaMin}–${o.etaMax} working days.</p>${cash ? `<p style="margin:0">${esc(cash)}</p>` : ""}`,
      { label: "Track your order", href: o.link },
    ),
  };
}

export function orderShippedSms(o: OrderInfo, store: Store) {
  const cash = o.paymentMethod === "cod" && o.paymentStatus !== "paid" ? ` Keep ${tk(o.total)} ready.` : "";
  return `${store.name}: order ${o.orderNo} shipped with ${o.courier}${o.trackingNo ? `, tracking ${o.trackingNo}` : ""}.${cash} Track: ${o.link}`;
}

export function adminNewOrderEmail(o: OrderInfo, store: Store): Email {
  const pay = `${METHOD[o.paymentMethod]} · ${o.paymentStatus}`;
  return {
    subject: `New order ${o.orderNo}: ${formatBDT(o.total)} (${METHOD[o.paymentMethod]})`,
    text: `New order ${o.orderNo}\n\nCustomer: ${o.customerName}, ${o.phone}${o.email ? `, ${o.email}` : ""}\nDeliver to: ${o.address}\nPayment: ${pay}\n${o.note ? `Customer note: ${o.note}\n` : ""}\n${itemsText(o)}\n\nOpen in admin: ${o.adminLink}`,
    html: layout(
      store,
      `New order ${o.orderNo}`,
      `<p style="margin:0 0 8px"><strong>${esc(o.customerName)}</strong> · ${esc(o.phone)}${o.email ? ` · ${esc(o.email)}` : ""}<br>${esc(o.address)}<br>Payment: ${esc(pay)}</p>${o.note ? `<p style="margin:0 0 8px;background:#F7F5F0;padding:8px">Note: ${esc(o.note)}</p>` : ""}${itemsHtml(o)}`,
      { label: "Open in admin", href: o.adminLink },
    ),
  };
}

export type ContactInfo = { name: string; email: string; phone?: string; subject?: string; message: string; adminLink: string };
export function adminContactEmail(m: ContactInfo, store: Store): Email {
  return {
    subject: `Website message from ${m.name}${m.subject ? `: ${m.subject}` : ""}`,
    text: `${m.name} <${m.email}>${m.phone ? `, ${m.phone}` : ""}\n${m.subject ? `Subject: ${m.subject}\n` : ""}\n${m.message}\n\nReply to this email to answer. All messages: ${m.adminLink}`,
    html: layout(
      store,
      "New website message",
      `<p style="margin:0 0 8px"><strong>${esc(m.name)}</strong> · <a href="mailto:${esc(m.email)}">${esc(m.email)}</a>${m.phone ? ` · ${esc(m.phone)}` : ""}</p>${m.subject ? `<p style="margin:0 0 8px"><strong>${esc(m.subject)}</strong></p>` : ""}<p style="margin:0;white-space:pre-line">${esc(m.message)}</p>`,
      { label: "Open messages", href: m.adminLink },
    ),
  };
}

export type AbandonedLead = { name: string; phone: string; email?: string | null; cartValue: number; items: string[]; lastActivityAt: Date };
export function abandonedDigestEmail(leads: AbandonedLead[], minutes: number, adminLink: string, store: Store): Email {
  const total = leads.reduce((n, l) => n + l.cartValue, 0);
  const subject = `${leads.length} abandoned cart${leads.length === 1 ? "" : "s"} worth ${formatBDT(total)}`;
  const when = (d: Date) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(d);
  return {
    subject,
    text: `These shoppers left items in their bag for over ${minutes} minutes. A quick call or WhatsApp often saves the sale.\n\n${leads
      .map((l) => `${l.name}, ${l.phone}${l.email ? `, ${l.email}` : ""}: ${formatBDT(l.cartValue)} (last active ${when(l.lastActivityAt)})\n  ${l.items.join("; ")}`)
      .join("\n\n")}\n\nAll leads: ${adminLink}`,
    html: layout(
      store,
      subject,
      `<p style="margin:0 0 12px">These shoppers left items in their bag for over ${minutes} minutes. A quick call or WhatsApp often saves the sale.</p>${leads
        .map((l) => `<p style="margin:0 0 12px;padding-bottom:12px;border-bottom:1px solid #E2DDD3"><strong>${esc(l.name)}</strong> · <a href="tel:${esc(l.phone)}">${esc(l.phone)}</a>${l.email ? ` · ${esc(l.email)}` : ""}<br><strong>${formatBDT(l.cartValue)}</strong> · last active ${esc(when(l.lastActivityAt))}<br><span style="color:#7A746B">${esc(l.items.join("; "))}</span></p>`)
        .join("")}`,
      { label: "Open leads", href: adminLink },
    ),
  };
}

export function testEmail(store: Store): Email {
  return {
    subject: `${store.name}: test email`,
    text: `This is a test email from the ${store.name} admin. If you can read it, email sending works.`,
    html: layout(store, "Test email", `<p style="margin:0">This is a test email from the ${esc(store.name)} admin. If you can read it, email sending works.</p>`),
  };
}
