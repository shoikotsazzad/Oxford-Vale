"use client";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { updateProfile } from "@/server/actions/account";

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  return (
    <form
      noValidate
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        start(async () => {
          const res = await updateProfile(data);
          setSaved(res.ok);
          setErrors(res.ok ? {} : (res.error.fields ?? {}));
        });
      }}
    >
      <TextField label={t.account.name} name="name" defaultValue={name} autoComplete="name" error={errors.name} />
      <TextField label={t.account.phone} name="phone" type="tel" defaultValue={phone} autoComplete="tel" error={errors.phone} />
      <TextField label={t.account.email} name="email-readonly" type="email" defaultValue={email} readOnly className="sm:col-span-2 opacity-70" />
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button type="submit" disabled={pending}>{t.account.save}</Button>
        {saved && <span className="text-sm text-success" role="status">{t.account.saved}</span>}
      </div>
    </form>
  );
}
