import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-charcoal px-4 py-16">
      <div className="w-full max-w-sm rounded-lg bg-paper p-8">
        <p className="font-serif text-2xl tracking-wide">OXFORD VALE</p>
        <p className="label mt-1 text-muted">Admin sign in</p>
        <Suspense>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
