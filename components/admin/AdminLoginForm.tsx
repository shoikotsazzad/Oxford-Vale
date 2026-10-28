"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { adminLogin } from "@/server/actions/admin/auth";
import { FormStatus, useAdminAction } from "./useAdminAction";

export function AdminLoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? undefined;
  const [form, setForm] = useState({ email: "", password: "" });
  const { run, pending, error, fields, clear } = useAdminAction();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [k]: e.target.value });
    clear(k);
  };
  return (
    <form
      className="mt-6 space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        run(() => adminLogin({ ...form, next }), { onOk: (d) => router.replace(d.next) });
      }}
    >
      <FormStatus error={error} message={null} />
      <TextField label="Email" name="email" type="email" autoComplete="username" value={form.email} onChange={set("email")} error={fields.email} required />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={set("password")} error={fields.password} required />
      <Button type="submit" className="w-full" disabled={pending} arrow>{pending ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}
