import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/server/admin/guard";
import { ROLE_LABEL } from "@/server/auth/rbac";
import { UserModel, ADMIN_ROLES } from "@/models";
import { AdminUserForm, ResetPasswordForm, type AdminUserValue } from "@/components/admin/UserForms";
import { Badge, Card, dateTime, PageHeader, Table, TableSkeleton, td, th } from "@/components/admin/ui";

export const metadata = { title: "Admin users" };

export default function UsersPage(props: PageProps<"/admin/users">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Users {...props} />
    </Suspense>
  );
}

async function Users({ searchParams }: PageProps<"/admin/users">) {
  const admin = await requireAdminPage("users");
  const { edit } = await searchParams;
  const users = await UserModel.find({ role: { $in: ADMIN_ROLES } }).sort({ isActive: -1, role: 1, name: 1 }).select("name email role isActive lastLoginAt").lean();

  let form: AdminUserValue | null = null;
  if (edit === "new") form = { name: "", email: "", role: "staff", isActive: true };
  else if (typeof edit === "string") {
    const u = users.find((x) => String(x._id) === edit);
    if (!u) notFound();
    form = { id: String(u._id), name: u.name, email: u.email, role: u.role as AdminUserValue["role"], isActive: u.isActive };
  }

  return (
    <>
      <PageHeader title="Admin users" text="Role changes and deactivation sign the person out everywhere." actions={!form && <Link href="/admin/users?edit=new" className="label inline-flex h-10 items-center rounded-md bg-ink px-4 text-paper hover:bg-charcoal">Add admin</Link>} />
      {form && (
        <div className="mb-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Card title={form.id ? `Edit ${form.name}` : "New admin user"}>
            <AdminUserForm key={form.id ?? "new"} initial={form} isSelf={form.id === admin.id} />
          </Card>
          {form.id && (
            <Card title="Reset password">
              <ResetPasswordForm id={form.id} />
            </Card>
          )}
        </div>
      )}
      <Table minWidth="40rem">
        <thead>
          <tr><th className={th}>Name</th><th className={th}>Role</th><th className={th}>Last sign in</th><th className={th}>Status</th><th className={th} /></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={String(u._id)}>
              <td className={td}><span className="font-medium">{u.name}</span>{String(u._id) === admin.id && <span className="text-muted"> (you)</span>}<p className="text-xs text-muted">{u.email}</p></td>
              <td className={td}>{ROLE_LABEL[u.role]}</td>
              <td className={td}>{u.lastLoginAt ? dateTime(u.lastLoginAt) : "Never"}</td>
              <td className={td}>{u.isActive ? <Badge tone="ok">Active</Badge> : <Badge>Deactivated</Badge>}</td>
              <td className={`${td} text-right`}><Link href={`/admin/users?edit=${u._id}`} className="underline">Edit</Link></td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
