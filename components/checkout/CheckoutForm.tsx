"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Checkbox, TextArea, TextField } from "@/components/ui/Field";
import { LockIcon } from "@/components/ui/icons";
import { fmt } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { addressLines } from "@/lib/address";
import { formatPhone, isValidPhone, normalizePhone } from "@/lib/phone";
import type { PaymentMethod } from "@/models/enums";
import { imageSrc, isPlaceholder } from "@/lib/images";
import { getCheckoutQuote, placeOrderAction, saveCheckoutLead, type QuoteResult } from "@/server/actions/checkout";
import { useCart } from "@/components/cart/CartProvider";
import { AddressFields, emptyAddress, type AddressValue } from "./AddressFields";

type Line = { variantId: string; name: string; image: string | null; size: string; colour: string; qty: number; lineTotal: number };
type SavedAddress = AddressValue & { id: string; label: string; isDefault: boolean };
type Props = {
  lines: Line[];
  initialQuote: QuoteResult;
  contact: { name: string; phone: string; email: string };
  savedAddresses: SavedAddress[];
  loggedIn: boolean;
  payments: Record<PaymentMethod, boolean>;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CheckoutForm({ lines, initialQuote, contact: initialContact, savedAddresses, loggedIn, payments }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const { apply } = useCart();
  const defaultAddr = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];

  const [contact, setContact] = useState(initialContact);
  const [address, setAddress] = useState<AddressValue>(defaultAddr ?? { ...emptyAddress, name: initialContact.name, phone: initialContact.phone });
  const [savedId, setSavedId] = useState<string | null>(defaultAddr?.id ?? null);
  const [method, setMethod] = useState<PaymentMethod>(payments.stripe ? "stripe" : "paypal");
  const [deliveryOption, setDeliveryOption] = useState(initialQuote.zone?.id ?? "");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [note, setNote] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [q, setQ] = useState(initialQuote);
  const [quoting, setQuoting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const leadSent = useRef("");

  // Recalculate delivery options, fees and discount whenever the country, option or coupon changes.
  useEffect(() => {
    let live = true;
    const timer = setTimeout(async () => {
      setQuoting(true);
      const res = await getCheckoutQuote({ country: address.country, deliveryOption, couponCode: coupon, phone: contact.phone });
      if (live && res.ok) {
        setQ(res.data);
        // A new country has its own options: fall back to the first one.
        if (res.data.zone && res.data.zone.id !== deliveryOption) setDeliveryOption(res.data.zone.id);
      }
      if (live) setQuoting(false);
    }, 150);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [address.country, deliveryOption, coupon, contact.phone]);

  // Lead capture at checkout start: once name, phone and email look valid.
  function maybeSaveLead() {
    const key = `${contact.name}|${contact.phone}|${contact.email}`;
    if (contact.name.trim().length >= 2 && isValidPhone(normalizePhone(contact.phone)) && EMAIL.test(contact.email) && leadSent.current !== key) {
      leadSent.current = key;
      void saveCheckoutLead(contact);
    }
  }

  const appliedCoupon = q.couponCode;
  const couponError = coupon && q.couponError ? q.couponError : errors.couponCode;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    start(async () => {
      const res = await placeOrderAction({
        contact, address, deliveryOption, paymentMethod: method, couponCode: appliedCoupon ?? "", note,
        createAccount: !loggedIn && createAccount, password, saveAddress: loggedIn && saveAddress && !savedId,
      });
      if (!res.ok) {
        setErrors(res.error.fields ?? {});
        setFormError(res.error.message);
        if (res.error.code === "CONFLICT" || res.error.code === "OUT_OF_STOCK") router.refresh();
        document.getElementById("checkout-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      apply({ lines: [], count: 0, subtotal: 0, freeDeliveryThreshold: 0, freeDeliveryGap: 0, needsLead: false, lead: null, notices: [] });
      if (res.data.external) window.location.assign(res.data.next);
      else router.push(res.data.next);
    });
  }

  const methods: { id: PaymentMethod; title: string; text: string; on: boolean }[] = [
    { id: "stripe", title: t.checkout.stripe, text: t.checkout.stripeText, on: payments.stripe },
    { id: "paypal", title: t.checkout.paypal, text: t.checkout.paypalText, on: payments.paypal },
  ];
  const section = "rounded-lg bg-surface/60 p-5 ring-1 ring-line md:p-6";
  const h2 = "font-serif text-2xl";

  return (
    <form
      onSubmit={submit}
      // Field errors belong to the last submit; drop them once the shopper edits any field.
      onChange={() => Object.keys(errors).length > 0 && setErrors({})}
      noValidate
      className="mt-8 grid gap-8 lg:grid-cols-[1fr_26rem] lg:gap-12"
    >
      <div className="space-y-6">
        {formError && (
          <p id="checkout-error" role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">{formError}</p>
        )}

        <section className={section} aria-labelledby="h-contact">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="h-contact" className={h2}>{t.checkout.contact}</h2>
            {!loggedIn && (
              <p className="text-sm text-muted">{t.checkout.loginPrompt} <Link href="/account/login?next=/checkout" className="text-ink underline underline-offset-4">{t.checkout.login}</Link></p>
            )}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <TextField label={t.checkout.name} name="contact-name" autoComplete="name" value={contact.name} error={errors["contact.name"]}
              onChange={(e) => {
                const name = e.target.value;
                setContact((c) => ({ ...c, name }));
                if (!savedId && address.name === contact.name) setAddress((a) => ({ ...a, name }));
              }}
              onBlur={maybeSaveLead} />
            <TextField label={t.checkout.phone} name="contact-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="07700 900123" value={contact.phone} error={errors["contact.phone"]}
              onChange={(e) => {
                const phone = e.target.value;
                setContact((c) => ({ ...c, phone }));
                if (!savedId && address.phone === contact.phone) setAddress((a) => ({ ...a, phone }));
              }}
              onBlur={maybeSaveLead} />
            <TextField label={t.checkout.email} name="contact-email" type="email" autoComplete="email" hint={t.checkout.emailHint} value={contact.email} error={errors["contact.email"]} className="sm:col-span-2"
              onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} onBlur={maybeSaveLead} />
          </div>
          {!loggedIn && (
            <div className="mt-3">
              <Checkbox name="create-account" label={t.checkout.createAccount} checked={createAccount} onChange={setCreateAccount} />
              {createAccount && (
                <TextField label={t.checkout.password} name="password" type="password" autoComplete="new-password" hint={t.checkout.passwordHint} value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} className="mt-2 sm:max-w-xs" />
              )}
            </div>
          )}
        </section>

        <section className={section} aria-labelledby="h-shipping">
          <h2 id="h-shipping" className={h2}>{t.checkout.shipping}</h2>
          {savedAddresses.length > 0 && (
            <fieldset className="mt-5">
              <legend className="label text-muted">{t.checkout.savedAddresses}</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {savedAddresses.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer gap-3 rounded-md border p-4 text-sm ${savedId === a.id ? "border-ink bg-surface" : "border-line"}`}>
                    <input type="radio" name="saved-address" className="mt-0.5 accent-ink" checked={savedId === a.id} onChange={() => { setSavedId(a.id); setAddress(a); }} />
                    <span><span className="font-medium">{a.label}</span><br />{a.name} · {formatPhone(a.phone)}<br /><span className="text-muted">{addressLines(a).join(", ")}</span></span>
                  </label>
                ))}
                <label className={`flex cursor-pointer items-center gap-3 rounded-md border p-4 text-sm ${savedId === null ? "border-ink bg-surface" : "border-line"}`}>
                  <input type="radio" name="saved-address" className="accent-ink" checked={savedId === null} onChange={() => { setSavedId(null); setAddress({ ...emptyAddress, name: contact.name, phone: contact.phone }); }} />
                  {t.checkout.newAddress}
                </label>
              </div>
            </fieldset>
          )}
          {(savedId === null || !savedAddresses.length) && (
            <div className="mt-5">
              <AddressFields value={address} onChange={setAddress} errors={errors} />
              {loggedIn && <div className="mt-2"><Checkbox name="save-address" label={t.checkout.saveAddress} checked={saveAddress} onChange={setSaveAddress} /></div>}
            </div>
          )}
        </section>

        <section className={section} aria-labelledby="h-delivery">
          <h2 id="h-delivery" className={h2}>{t.checkout.delivery}</h2>
          {q.options.length ? (
            <div className={`mt-5 grid gap-3 ${quoting ? "opacity-60" : ""}`} role="radiogroup" aria-labelledby="h-delivery">
              {q.options.map((o) => (
                <label key={o.id} className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors ${deliveryOption === o.id ? "border-ink bg-surface" : "border-line hover:border-ink/40"}`}>
                  <input type="radio" name="delivery" value={o.id} checked={deliveryOption === o.id} onChange={() => setDeliveryOption(o.id)} className="mt-1 accent-ink" />
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{o.name}</span>
                    <span className="block text-xs text-muted">{fmt(t.checkout.days, { min: o.etaMinDays, max: o.etaMaxDays })}{o.note ? ` · ${o.note}` : ""}</span>
                  </span>
                  <span className="text-sm">{o.fee === 0 ? t.checkout.free : formatMoney(o.fee)}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-md bg-sand px-4 py-3 text-sm text-muted">{t.checkout.zoneUnknown}</p>
          )}
          {errors.deliveryOption && <p className="mt-2 text-sm text-danger">{errors.deliveryOption}</p>}
        </section>

        <section className={section} aria-labelledby="h-payment">
          <h2 id="h-payment" className={h2}>{t.checkout.payment}</h2>
          <div className="mt-5 grid gap-3" role="radiogroup" aria-labelledby="h-payment">
            {methods.filter((m) => m.on).map((m) => (
              <label key={m.id} className={`flex cursor-pointer gap-3 rounded-md border p-4 transition-colors ${method === m.id ? "border-ink bg-surface" : "border-line hover:border-ink/40"}`}>
                <input type="radio" name="payment" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="mt-1 accent-ink" />
                <span>
                  <span className="block text-sm font-medium">{m.title}</span>
                  <span className="block text-xs text-muted">{m.text}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.paymentMethod && <p className="mt-2 text-sm text-danger">{errors.paymentMethod}</p>}
          <TextArea label={t.checkout.note} name="note" rows={2} hint={t.checkout.noteHint} value={note} onChange={(e) => setNote(e.target.value)} error={errors.note} className="mt-5" />
        </section>
      </div>

      <aside className="self-start lg:sticky lg:top-28">
        <div className={section}>
          <h2 className="font-serif text-2xl">{t.checkout.summary}</h2>
          <ul className="mt-4 divide-y divide-line">
            {lines.map((l) => {
              const src = imageSrc(l.image);
              return (
                <li key={l.variantId} className="flex gap-3 py-3">
                  <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded bg-sand">
                    <Image src={src} alt="" fill sizes="64px" className="object-cover" unoptimized={isPlaceholder(src)} />
                    <span className="absolute -top-0 -right-0 flex h-5 min-w-5 items-center justify-center rounded-bl bg-ink px-1 text-[10px] text-paper">{l.qty}</span>
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block leading-snug">{l.name}</span>
                    <span className="block text-xs text-muted">{l.size !== "One Size" && `${l.size} · `}{l.colour}</span>
                  </span>
                  <span className="text-sm">{formatMoney(l.lineTotal)}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 border-t border-line pt-4">
            {appliedCoupon ? (
              <p className="flex items-center justify-between rounded-md bg-success/10 px-3 py-2 text-sm text-success">
                {fmt(t.checkout.couponApplied, { code: appliedCoupon })}
                <button type="button" onClick={() => { setCoupon(""); setCouponInput(""); }} className="text-xs underline underline-offset-4">{t.checkout.removeCoupon}</button>
              </p>
            ) : (
              <div className="flex items-end gap-2">
                <TextField label={t.checkout.coupon} name="coupon" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} className="flex-1"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setCoupon(couponInput.trim()); } }} />
                <Button variant="secondary" onClick={() => setCoupon(couponInput.trim())} disabled={!couponInput.trim() || quoting} className="min-h-12">{t.checkout.apply}</Button>
              </div>
            )}
            {couponError && <p className="mt-2 text-sm text-danger" role="alert">{couponError}</p>}
          </div>

          <dl className={`mt-4 space-y-2 border-t border-line pt-4 text-sm ${quoting ? "opacity-60" : ""}`} aria-live="polite">
            <div className="flex justify-between"><dt>{t.checkout.subtotal}</dt><dd>{formatMoney(q.subtotal)}</dd></div>
            {q.discount > 0 && <div className="flex justify-between text-success"><dt>{t.checkout.discount}</dt><dd>−{formatMoney(q.discount)}</dd></div>}
            <div className="flex justify-between"><dt>{t.checkout.deliveryFee}</dt><dd>{q.zone ? (q.deliveryFee === 0 ? t.checkout.free : formatMoney(q.deliveryFee)) : "—"}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base"><dt className="font-medium">{t.checkout.total}</dt><dd className="font-medium">{formatMoney(q.total)}</dd></div>
          </dl>

          {q.problems.length > 0 && (
            <div className="mt-4 rounded-md bg-sale/10 px-4 py-3 text-xs text-sale">
              {q.problems.join(" ")} <ButtonLink href="/cart" variant="ghost" className="mt-2 !min-h-8 border-sale/40 !text-sale">{t.checkout.review}</ButtonLink>
            </div>
          )}

          <Button type="submit" className="mt-6 min-h-13 w-full" disabled={pending || q.problems.length > 0} arrow={!pending}>
            {pending ? t.checkout.placing : `${t.checkout.placeOrder} · ${formatMoney(q.total)}`}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted"><LockIcon size={14} /> {t.checkout.terms}</p>
        </div>
      </aside>
    </form>
  );
}
