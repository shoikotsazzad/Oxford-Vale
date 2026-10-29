"use client";
import { useI18n } from "@/components/I18nProvider";
import { SelectField, TextField } from "@/components/ui/Field";
import { COUNTRIES, HOME_COUNTRY } from "@/lib/address";

export type AddressValue = { name: string; phone: string; line1: string; line2: string; city: string; county: string; postcode: string; country: string };
export const emptyAddress: AddressValue = { name: "", phone: "", line1: "", line2: "", city: "", county: "", postcode: "", country: HOME_COUNTRY };

/** Recipient and postal address. UK first: postcode is required (and checked) for UK addresses. */
export function AddressFields({ value, onChange, errors = {}, prefix = "address" }: { value: AddressValue; onChange: (v: AddressValue) => void; errors?: Record<string, string>; prefix?: string }) {
  const { t } = useI18n();
  const err = (k: keyof AddressValue) => errors[`${prefix}.${k}`];
  const set = (patch: Partial<AddressValue>) => onChange({ ...value, ...patch });
  const uk = value.country === HOME_COUNTRY;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label={t.checkout.recipient} name={`${prefix}-name`} autoComplete="shipping name" value={value.name} onChange={(e) => set({ name: e.target.value })} error={err("name")} />
      <TextField label={t.checkout.recipientPhone} name={`${prefix}-phone`} type="tel" inputMode="tel" autoComplete="shipping tel" placeholder="07700 900123" value={value.phone} onChange={(e) => set({ phone: e.target.value })} error={err("phone")} />
      <SelectField label={t.checkout.country} name={`${prefix}-country`} autoComplete="shipping country" value={value.country} onChange={(e) => set({ country: e.target.value })} error={err("country")} className="sm:col-span-2">
        {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
      </SelectField>
      <TextField label={t.checkout.line1} name={`${prefix}-line1`} autoComplete="shipping address-line1" value={value.line1} onChange={(e) => set({ line1: e.target.value })} error={err("line1")} className="sm:col-span-2" />
      <TextField label={t.checkout.line2} name={`${prefix}-line2`} autoComplete="shipping address-line2" value={value.line2} onChange={(e) => set({ line2: e.target.value })} error={err("line2")} className="sm:col-span-2" />
      <TextField label={t.checkout.city} name={`${prefix}-city`} autoComplete="shipping address-level2" value={value.city} onChange={(e) => set({ city: e.target.value })} error={err("city")} />
      <TextField label={uk ? t.checkout.county : t.checkout.region} name={`${prefix}-county`} autoComplete="shipping address-level1" value={value.county} onChange={(e) => set({ county: e.target.value })} error={err("county")} />
      <TextField
        label={uk ? t.checkout.postcode : t.checkout.postcodeIntl}
        name={`${prefix}-postcode`}
        autoComplete="shipping postal-code"
        autoCapitalize="characters"
        placeholder={uk ? "SW1A 1AA" : undefined}
        value={value.postcode}
        onChange={(e) => set({ postcode: e.target.value.toUpperCase() })}
        error={err("postcode")}
      />
    </div>
  );
}
