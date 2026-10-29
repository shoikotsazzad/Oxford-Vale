import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <div className="relative flex flex-1 items-center justify-center bg-charcoal px-4 py-16">
      <ThemeToggle className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-md text-white/80 hover:bg-white/10" />
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
