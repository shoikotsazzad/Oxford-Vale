"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Checkbox, TextField } from "@/components/ui/Field";
import { AddressFields, emptyAddress, type AddressValue } from "@/components/checkout/AddressFields";
import { addressLines } from "@/lib/address";
import { formatPhone } from "@/lib/phone";
import { deleteAddress, saveAddress } from "@/server/actions/account";

type Saved = AddressValue & { id: string; label: string; isDefault: boolean };
type Draft = AddressValue & { id?: string; label: string; isDefault: boolean };

export function AddressBook({ addresses, defaults }: { addresses: Saved[]; defaults: { name: string; phone: string } }) {
  const { t } = useI18n();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const open = (d: Draft) => {
    setErrors({});
    setMsg(null);
    setDraft(d);
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    start(async () => {
      const res = await saveAddress(draft);
      if (res.ok) {
        setDraft(null);
        router.refresh();
      } else {
        // Schema paths come back without the "address." prefix the fields expect.
        setErrors(Object.fromEntries(Object.entries(res.error.fields ?? {}).map(([k, v]) => [k.includes(".") ? k : `address.${k}`, v])));
        setMsg(res.error.fields ? null : res.error.message);
      }
    });
  }

  if (draft) {
    return (
      <form noValidate onSubmit={submit} className="max-w-2xl space-y-4">
        <h2 className="font-serif text-2xl">{draft.id ? t.account.editAddress : t.account.addAddress}</h2>
        <TextField label={t.account.label} name="label" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} className="sm:max-w-xs" />
        <AddressFields value={draft} onChange={(v) => setDraft({ ...draft, ...v })} errors={errors} />
        <Checkbox name="default" label={t.account.makeDefault} checked={draft.isDefault} onChange={(v) => setDraft({ ...draft, isDefault: v })} />
        {msg && <p className="text-sm text-danger" role="alert">{msg}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>{t.account.save}</Button>
          <Button variant="secondary" onClick={() => setDraft(null)}>{t.account.cancel}</Button>
        </div>
      </form>
    );
  }

  return (
    <div>
      {addresses.length === 0 && <p className="text-muted">{t.account.noAddresses}</p>}
      <ul className="grid gap-4 sm:grid-cols-2">
        {addresses.map((a) => (
          <li key={a.id} className="rounded-lg bg-surface/60 p-5 text-sm ring-1 ring-line">
            <p className="flex items-center gap-2 font-medium">{a.label}{a.isDefault && <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] tracking-wide text-paper uppercase">{t.account.default}</span>}</p>
            <p className="mt-2">{a.name} · {formatPhone(a.phone)}</p>
            <p className="text-muted">{addressLines(a).join(", ")}</p>
            <div className="mt-4 flex gap-4">
              <button type="button" onClick={() => open({ ...a })} className="min-h-9 text-xs underline underline-offset-4">{t.account.edit}</button>
              <button type="button" disabled={pending} onClick={() => {
                if (!window.confirm(t.account.deleteConfirm)) return;
                start(async () => { await deleteAddress(a.id); router.refresh(); });
              }} className="min-h-9 text-xs text-muted underline underline-offset-4 hover:text-danger">{t.account.delete}</button>
            </div>
          </li>
        ))}
      </ul>
      <Button className="mt-6" arrow onClick={() => open({ ...emptyAddress, ...defaults, label: "Home", isDefault: addresses.length === 0 })}>{t.account.addAddress}</Button>
    </div>
  );
}
