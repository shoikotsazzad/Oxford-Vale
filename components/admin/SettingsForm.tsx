"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox, TextArea, TextField } from "@/components/ui/Field";
import { saveSettings } from "@/server/actions/admin/store";
import type { SettingsInput } from "@/lib/validation/admin";
import { FormStatus, useAdminAction } from "./useAdminAction";

type Path = string; // dot path, e.g. "contact.phone" or "hero.ctas.0.label"

const get = (o: unknown, path: Path): unknown => path.split(".").reduce<unknown>((x, k) => (x as Record<string, unknown> | undefined)?.[k], o);
function setIn<T>(o: T, path: Path, value: unknown): T {
  const [k, ...rest] = path.split(".");
  const src = o as Record<string, unknown>;
  const copy = (Array.isArray(o) ? [...(o as unknown[])] : { ...src }) as Record<string, unknown>;
  copy[k] = rest.length ? setIn(src[k], rest.join("."), value) : value;
  return copy as T;
}

function Section({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {text && <p className="mt-1 text-xs text-muted">{text}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
const Grid = ({ children }: { children: React.ReactNode }) => <div className="grid gap-4 sm:grid-cols-2">{children}</div>;

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const [v, setV] = useState(initial);
  const { run, pending, error, fields, message, clear } = useAdminAction();
  const f = (path: Path, label: string, extra: Partial<React.ComponentProps<typeof TextField>> = {}) => (
    <TextField label={label} name={path} value={String(get(v, path) ?? "")} error={fields[path]} onChange={(e) => { setV((p) => setIn(p, path, e.target.value)); clear(path); }} {...extra} />
  );
  const check = (path: Path, label: string) => <Checkbox label={label} name={path} checked={Boolean(get(v, path))} onChange={(x) => setV((p) => setIn(p, path, x))} />;

  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveSettings(v), { success: "Settings saved. The store updates right away." });
      }}
    >
      <Section title="Store">
        <Grid>{f("storeName", "Store name")}{f("tagline", "Tagline")}</Grid>
        <Grid>{f("legal.name", "Legal name")}{f("legal.tradeLicence", "Trade licence no.")}</Grid>
        <Grid>{f("legal.tin", "TIN")}{f("legal.bin", "BIN (VAT)")}</Grid>
      </Section>

      <Section title="Contact" text="Shown in the header, footer, contact page and invoices. The orders email receives new-order alerts (step 6).">
        <Grid>{f("contact.phone", "Phone")}{f("contact.whatsapp", "WhatsApp")}</Grid>
        <Grid>{f("contact.email", "Email", { type: "email" })}{f("contact.supportEmail", "Support email", { type: "email" })}</Grid>
        {f("contact.ordersEmail", "Orders email (admin alerts)", { type: "email" })}
        {f("address.line", "Address")}
        <div className="grid gap-4 sm:grid-cols-4">{f("address.area", "Area")}{f("address.city", "City")}{f("address.postalCode", "Postcode")}{f("address.country", "Country")}</div>
        <fieldset>
          <legend className="text-sm">Opening hours</legend>
          <div className="mt-2 space-y-2">
            {v.hours.map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                {f(`hours.${i}.label`, "Days")}
                {f(`hours.${i}.value`, "Hours")}
                <Button variant="secondary" className="border-transparent" onClick={() => setV((p) => ({ ...p, hours: p.hours.filter((__, j) => j !== i) }))}>Remove</Button>
              </div>
            ))}
            {v.hours.length < 7 && <Button variant="secondary" onClick={() => setV((p) => ({ ...p, hours: [...p.hours, { label: "", value: "" }] }))}>Add hours</Button>}
          </div>
        </fieldset>
      </Section>

      <Section title="Social links">
        <Grid>{f("socials.facebook", "Facebook")}{f("socials.instagram", "Instagram")}</Grid>
        <Grid>{f("socials.youtube", "YouTube")}{f("socials.tiktok", "TikTok")}</Grid>
      </Section>

      <Section title="Home page">
        {check("announcementBar.active", "Show the announcement bar")}
        <Grid>{f("announcementBar.text", "Announcement text")}{f("announcementBar.link", "Announcement link")}</Grid>
        <Grid>{f("hero.eyebrow", "Hero eyebrow")}{f("hero.title", "Hero wordmark")}</Grid>
        <TextArea label="Hero subtitle" name="hero.subtitle" rows={2} value={v.hero.subtitle} error={fields["hero.subtitle"]} onChange={(e) => setV((p) => setIn(p, "hero.subtitle", e.target.value))} />
        <Grid>{f("hero.image", "Hero image path")}{f("hero.note", "Hero side note")}</Grid>
        {v.hero.ctas.map((_, i) => (
          <Grid key={i}>{f(`hero.ctas.${i}.label`, `Button ${i + 1} label`)}{f(`hero.ctas.${i}.href`, `Button ${i + 1} link`)}</Grid>
        ))}
        <Grid>{f("newSeasonBanner.eyebrow", "New-season eyebrow")}{f("newSeasonBanner.title", "New-season headline")}</Grid>
        <TextArea label="New-season text" name="newSeasonBanner.text" rows={2} value={v.newSeasonBanner.text} error={fields["newSeasonBanner.text"]} onChange={(e) => setV((p) => setIn(p, "newSeasonBanner.text", e.target.value))} />
        <div className="grid gap-4 sm:grid-cols-3">{f("newSeasonBanner.image", "New-season image path")}{f("newSeasonBanner.cta.label", "Button label")}{f("newSeasonBanner.cta.href", "Button link")}</div>
      </Section>

      <Section title="Orders & stock">
        <div className="grid gap-4 sm:grid-cols-3">
          {f("freeDeliveryThreshold", "Free delivery over (৳)", { type: "number", min: 0, hint: "0 turns free delivery off" })}
          {f("abandonedAfterMinutes", "Abandoned after (minutes)", { type: "number", min: 15 })}
          {f("lowStockThreshold", "Low stock at or below", { type: "number", min: 0 })}
        </div>
      </Section>

      <Section title="Payments" text="Methods turned off disappear from checkout. bKash/Nagad numbers are shown to customers with the amount to send.">
        <div className="flex flex-wrap gap-x-6">{check("payments.cod", "Cash on delivery")}{check("payments.sslcommerz", "SSLCommerz (cards, mobile banking)")}</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">{check("payments.bkash.enabled", "bKash (manual Trx ID)")}{f("payments.bkash.number", "bKash merchant number")}</div>
          <div className="space-y-2">{check("payments.nagad.enabled", "Nagad (manual Trx ID)")}{f("payments.nagad.number", "Nagad merchant number")}</div>
        </div>
      </Section>

      <Section title="Invoices">
        <div className="grid gap-4 sm:grid-cols-3">{f("bank.accountName", "Bank account name")}{f("bank.accountNo", "Account no.")}{f("bank.bankBranch", "Bank & branch")}</div>
        <TextArea label="Invoice footer" name="invoiceFooter" rows={2} value={v.invoiceFooter} error={fields.invoiceFooter} onChange={(e) => setV((p) => ({ ...p, invoiceFooter: e.target.value }))} />
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
        <div className="min-w-0 flex-1"><FormStatus error={error} message={message} /></div>
      </div>
    </form>
  );
}
