"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { adminLogout } from "@/server/actions/admin/auth";

export type NavItem = { href: string; label: string; badge?: number };
export type NavGroup = { title: string; items: NavItem[] };

function NavLinks({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <nav aria-label="Admin" className="space-y-6">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="label px-3 text-white/60">{g.title}</p>
          <ul className="mt-2 space-y-0.5">
            {g.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active(item.href) ? "page" : undefined}
                  className={`flex min-h-10 items-center justify-between rounded-md px-3 text-sm transition-colors ${active(item.href) ? "bg-white text-ink" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
                >
                  {item.label}
                  {item.badge ? <span className="rounded-full bg-warn px-2 text-xs leading-5 text-white">{item.badge}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Footer({ name, role }: { name: string; role: string }) {
  return (
    <div className="border-t border-white/10 pt-4 text-sm">
      <p className="truncate text-white">{name}</p>
      <p className="text-white/50">{role}</p>
      <div className="mt-3 flex gap-2">
        <Link href="/" className="label rounded-md border border-white/20 px-3 py-2 text-white/80 hover:bg-white/10" target="_blank">View store</Link>
        <form action={adminLogout}>
          <button className="label rounded-md border border-white/20 px-3 py-2 text-white/80 hover:bg-white/10">Log out</button>
        </form>
      </div>
    </div>
  );
}

const Brand = () => (
  <Link href="/admin" className="block px-3">
    <span className="font-serif text-xl tracking-wide text-white">OXFORD VALE</span>
    <span className="label block text-white/60">Admin</span>
  </Link>
);

export function AdminSidebar({ groups, name, role }: { groups: NavGroup[]; name: string; role: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col justify-between gap-6 overflow-y-auto bg-charcoal px-3 py-6 lg:flex">
        <div className="space-y-8">
          <Brand />
          <NavLinks groups={groups} />
        </div>
        <Footer name={name} role={role} />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-charcoal px-4 lg:hidden">
        <Link href="/admin" className="font-serif text-lg text-white">OXFORD VALE <span className="label text-white/60">Admin</span></Link>
        <button type="button" onClick={() => setOpen(true)} className="flex h-11 w-11 items-center justify-center text-white" aria-label="Open menu" aria-expanded={open}>
          <MenuIcon />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div key={pathname} className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col justify-between gap-6 overflow-y-auto bg-charcoal px-3 py-5">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Brand />
                <button type="button" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center text-white" aria-label="Close menu">
                  <CloseIcon />
                </button>
              </div>
              <NavLinks groups={groups} onNavigate={() => setOpen(false)} />
            </div>
            <Footer name={name} role={role} />
          </div>
        </div>
      )}
    </>
  );
}
