import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdminRole } from "@/server/auth/session";
import { can, ROLE_LABEL } from "@/server/auth/rbac";
import { ContactMessageModel, OrderModel } from "@/models";
import { AdminSidebar, type NavGroup } from "@/components/admin/AdminSidebar";
import { TableSkeleton } from "@/components/admin/ui";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-6 lg:p-10"><TableSkeleton /></div>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

/** Real role check (proxy.ts only redirects visitors without a session cookie). */
async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) redirect("/admin/login");
  const [pending, newMessages] = await Promise.all([OrderModel.countDocuments({ status: "pending" }), ContactMessageModel.countDocuments({ status: "new" })]);
  const groups: NavGroup[] = [
    {
      title: "Sales",
      items: [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/orders", label: "Orders", badge: pending },
        { href: "/admin/customers", label: "Customers & leads" },
        { href: "/admin/messages", label: "Messages", badge: newMessages },
      ],
    },
    {
      title: "Catalog",
      items: [
        { href: "/admin/products", label: "Products" },
        { href: "/admin/categories", label: "Categories" },
        { href: "/admin/collections", label: "Collections" },
        { href: "/admin/coupons", label: "Coupons" },
        { href: "/admin/delivery-zones", label: "Delivery zones" },
      ],
    },
    ...(can(user.role, "settings")
      ? [{ title: "Store", items: [{ href: "/admin/settings", label: "Settings" }, { href: "/admin/users", label: "Admin users" }, { href: "/admin/audit-log", label: "Audit log" }] }]
      : []),
  ];
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <AdminSidebar groups={groups} name={user.name} role={ROLE_LABEL[user.role]} />
      <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
