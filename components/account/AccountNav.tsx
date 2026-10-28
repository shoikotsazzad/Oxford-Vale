"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { logout } from "@/server/actions/auth";

export function AccountNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const links = [
    { href: "/account", label: t.account.overview },
    { href: "/account/orders", label: t.account.orders },
    { href: "/account/addresses", label: t.account.addresses },
    { href: "/account/wishlist", label: t.account.wishlist },
  ];
  const active = (href: string) => (href === "/account" ? pathname === href : pathname.startsWith(href));
  return (
    <nav aria-label="Account" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <ul className="flex gap-2 lg:flex-col lg:gap-1">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} aria-current={active(l.href) ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-md px-4 text-sm whitespace-nowrap ${active(l.href) ? "bg-ink text-white" : "hover:bg-sand"}`}>
              {l.label}
            </Link>
          </li>
        ))}
        <li>
          <form action={logout}>
            <button type="submit" className="flex min-h-11 items-center rounded-md px-4 text-sm whitespace-nowrap text-muted hover:bg-sand hover:text-ink">{t.account.logout}</button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
