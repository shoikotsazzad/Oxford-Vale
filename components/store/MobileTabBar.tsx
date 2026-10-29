"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { useCart } from "@/components/cart/CartProvider";
import { BagIcon, GridIcon, HomeIcon, SearchIcon, UserIcon } from "@/components/ui/icons";
import { OPEN_SEARCH_EVENT } from "./HeaderClient";

/** App-style bottom navigation for phones and tablets (below lg). Hidden during checkout so the pay button has the screen. */
export function MobileTabBar() {
  const { t } = useI18n();
  const { count, openDrawer } = useCart();
  const pathname = usePathname();
  if (pathname.startsWith("/checkout")) return null;

  const under = (...prefixes: string[]) => prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  // The search results page counts as Shop: the Search tab only opens the search panel.
  const tabs = [
    { href: "/", label: t.nav.home, Icon: HomeIcon, active: pathname === "/" },
    { href: "/shop", label: t.nav.shop, Icon: GridIcon, active: under("/shop", "/collections", "/product", "/search") },
    { href: "/search", label: t.nav.search, Icon: SearchIcon, active: false },
    { href: "/cart", label: t.nav.bag, Icon: BagIcon, active: pathname === "/cart", badge: count },
    { href: "/account", label: t.nav.account, Icon: UserIcon, active: under("/account") },
  ];

  return (
    <>
      {/* Keeps the footer clear of the fixed bar. */}
      <div aria-hidden="true" className="h-[calc(4.25rem+env(safe-area-inset-bottom))] lg:hidden" />
      <nav aria-label={t.nav.tabs} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-paper/85 lg:hidden">
        <ul className="mx-auto grid h-[4.25rem] max-w-2xl grid-cols-5">
          {tabs.map(({ href, label, Icon, active, badge }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey) return;
                  // Search and the bag open in place (search panel, bag drawer) instead of leaving the page.
                  if (href === "/search") {
                    e.preventDefault();
                    window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
                  } else if (href === "/cart" && pathname !== "/cart") {
                    e.preventDefault();
                    openDrawer();
                  }
                }}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] transition-colors ${active ? "font-medium text-ink" : "text-muted hover:text-ink"}`}
              >
                <span className={`relative flex h-8 w-12 items-center justify-center rounded-full transition-colors ${active ? "bg-ink text-paper" : ""}`}>
                  <Icon size={20} />
                  {badge != null && (
                    <span aria-hidden="true" className={`absolute -top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none ${active ? "bg-paper text-ink ring-1 ring-ink" : "bg-ink text-paper"}`}>
                      {badge}
                    </span>
                  )}
                </span>
                {label}
                {badge != null && <span className="sr-only">, {badge}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
