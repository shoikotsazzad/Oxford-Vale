"use client";
import { useI18n } from "@/components/I18nProvider";
import { SelectField, TextArea, TextField } from "@/components/ui/Field";
import { districtsOf, divisions, upazilasOf } from "@/lib/bd-geo";

export type AddressValue = { name: string; phone: string; division: string; district: string; upazila: string; addressLine: string };
export const emptyAddress: AddressValue = { name: "", phone: "", division: "", district: "", upazila: "", addressLine: "" };

/** Recipient + Division → District → Upazila selects. Changing a level clears the levels below it. */
export function AddressFields({ value, onChange, errors = {}, prefix = "address" }: { value: AddressValue; onChange: (v: AddressValue) => void; errors?: Record<string, string>; prefix?: string }) {
  const { t, lang } = useI18n();
  const err = (k: keyof AddressValue) => errors[`${prefix}.${k}`];
  const set = (patch: Partial<AddressValue>) => onChange({ ...value, ...patch });
  const label = (o: { name: string; bn?: string }) => (lang === "bn" && o.bn ? `${o.bn} (${o.name})` : o.name);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label={t.checkout.recipient} name={`${prefix}-name`} autoComplete="shipping name" value={value.name} onChange={(e) => set({ name: e.target.value })} error={err("name")} />
      <TextField label={t.checkout.recipientPhone} name={`${prefix}-phone`} type="tel" inputMode="tel" autoComplete="shipping tel" placeholder="01XXXXXXXXX" value={value.phone} onChange={(e) => set({ phone: e.target.value })} error={err("phone")} />
      <SelectField label={t.checkout.division} name={`${prefix}-division`} value={value.division} onChange={(e) => set({ division: e.target.value, district: "", upazila: "" })} error={err("division")}>
        <option value="">{t.checkout.choose}</option>
        {divisions.map((d) => <option key={d.name} value={d.name}>{label(d)}</option>)}
      </SelectField>
      <SelectField label={t.checkout.district} name={`${prefix}-district`} value={value.district} disabled={!value.division} onChange={(e) => set({ district: e.target.value, upazila: "" })} error={err("district")}>
        <option value="">{t.checkout.choose}</option>
        {districtsOf(value.division).map((d) => <option key={d.name} value={d.name}>{label(d)}</option>)}
      </SelectField>
      <SelectField label={t.checkout.upazila} name={`${prefix}-upazila`} value={value.upazila} disabled={!value.district} onChange={(e) => set({ upazila: e.target.value })} error={err("upazila")} className="sm:col-span-2">
        <option value="">{t.checkout.choose}</option>
        {upazilasOf(value.division, value.district).map((u) => <option key={u.name} value={u.name}>{label(u)}</option>)}
      </SelectField>
      <TextArea label={t.checkout.addressLine} name={`${prefix}-addressLine`} rows={2} autoComplete="shipping street-address" hint={t.checkout.addressHint} value={value.addressLine} onChange={(e) => set({ addressLine: e.target.value })} error={err("addressLine")} className="sm:col-span-2" />
    </div>
  );
}
