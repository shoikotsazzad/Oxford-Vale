"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Checkbox, SelectField, TextField } from "@/components/ui/Field";
import { resetAdminPassword, saveAdminUser } from "@/server/actions/admin/store";
import { FormStatus, useAdminAction } from "./useAdminAction";

export type AdminUserValue = { id?: string; name: string; email: string; role: "staff" | "manager" | "owner"; isActive: boolean };

export function AdminUserForm({ initial, isSelf }: { initial: AdminUserValue; isSelf: boolean }) {
  const router = useRouter();
  const [v, setV] = useState({ ...initial, password: "" });
  const { run, pending, error, fields, clear } = useAdminAction();
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => {
    setV((p) => ({ ...p, [k]: value }));
    clear(k);
  };
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveAdminUser(v), { onOk: () => router.push("/admin/users") });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" name="name" value={v.name} error={fields.name} onChange={(e) => set("name", e.target.value)} />
        <TextField label="Email" name="email" type="email" value={v.email} error={fields.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <SelectField label="Role" name="role" value={v.role} disabled={isSelf} onChange={(e) => set("role", e.target.value as AdminUserValue["role"])} hint="Staff: orders, customers, messages; views the catalog. Manager: also edits the catalog, coupons and zones. Owner: everything.">
        <option value="staff">Staff</option>
        <option value="manager">Manager</option>
        <option value="owner">Owner</option>
      </SelectField>
      {!v.id && <TextField label="Starting password" name="password" type="password" autoComplete="new-password" value={v.password} error={fields.password} onChange={(e) => set("password", e.target.value)} hint="10+ characters with a letter and a number. Share it privately." />}
      {!isSelf && <Checkbox label="Active (can sign in)" name="isActive" checked={v.isActive} onChange={(x) => set("isActive", x)} />}
      <FormStatus error={error} message={null} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : v.id ? "Save" : "Create admin"}</Button>
        <Button variant="secondary" className="border-transparent" onClick={() => router.push("/admin/users")}>Cancel</Button>
      </div>
    </form>
  );
}

export function ResetPasswordForm({ id }: { id: string }) {
  const [password, setPassword] = useState("");
  const { run, pending, error, fields, message } = useAdminAction();
  return (
    <form
      noValidate
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => resetAdminPassword({ id, password }), { success: "Password changed. Their other sessions were signed out.", onOk: () => setPassword("") });
      }}
    >
      <TextField label="New password" name="newPassword" type="password" autoComplete="new-password" value={password} error={fields.password} onChange={(e) => setPassword(e.target.value)} />
      <FormStatus error={error} message={message} />
      <Button type="submit" variant="secondary" disabled={pending || !password}>Set password</Button>
    </form>
  );
}
