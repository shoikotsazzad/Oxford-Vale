"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { BagIcon, ChevronDownIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/icons";
import { LanguageToggle } from "./LanguageToggle";
import { SearchPanel } from "./SearchPanel";
import { useCart } from "@/components/cart/CartProvider";

type NavLink = { name: string; href: string };
type Props = {
  storeName: string;
  tagline: string;
  navLinks: NavLink[];
  allCategories: NavLink[];
  collections: NavLink[];
};

type Panel = "menu" | "search" | "all" | null;

export function HeaderClient({ storeName, tagline, navLinks, allCategories, collections }: Props) {
  const { t } = useI18n();
  const { count: cartCount, openDrawer } = useCart();
  const pathname = usePathname();
  // Panels are "open on" a path, so they close when the route changes.
  const [state, setState] = useState<{ panel: Panel; path: string }>({ panel: null, path: pathname });
  const panel = state.path === pathname ? state.panel : null;
  const open = (p: Panel) => setState({ panel: p, path: pathname });
  const close = () => setState({ panel: null, path: pathname });

  // "All" menu opens on mouse hover; a short delay lets the pointer travel from the button to the panel.
  const lastPointer = useRef("");
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hoverOpen = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(hoverTimer.current);
    open("all");
  };
  const hoverClose = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setState((s) => (s.panel === "all" ? { ...s, panel: null } : s)), 180);
  };

  useEffect(() => {
    document.body.style.overflow = panel === "menu" || panel === "search" ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setState((s) => ({ ...s, panel: null }));
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [panel]);

  // The mega menu is a dropdown, not a page section: scrolling away closes it.
  useEffect(() => {
    if (panel !== "all") return;
    const y = window.scrollY;
    const onScroll = () => Math.abs(window.scrollY - y) > 24 && setState((s) => ({ ...s, panel: null }));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(hoverTimer.current);
    };
  }, [panel]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const iconBtn = "relative flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-ink/5";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 md:h-20 lg:px-8">
        {/* Left: categories (desktop) / menu button (mobile) */}
        <nav aria-label="Categories" className="flex items-center">
          <button type="button" className={`${iconBtn} -ml-2 xl:hidden`} aria-label={t.nav.menu} aria-expanded={panel === "menu"} aria-controls="mobile-menu" onClick={() => open("menu")}>
            <MenuIcon size={22} />
          </button>
          <ul className="hidden items-center gap-5 xl:flex">
            {navLinks.map((l, i) => (
              <li key={l.href} className={i >= 4 ? "hidden 2xl:block" : undefined}>
                <Link href={l.href} aria-current={isActive(l.href) ? "page" : undefined} className={`label py-2 transition-colors hover:text-ink ${isActive(l.href) ? "text-ink underline underline-offset-8" : "text-ink/75"}`}>
                  {l.name}
                </Link>
              </li>
            ))}
            <li onPointerEnter={hoverOpen} onPointerLeave={hoverClose}>
              <button
                type="button"
                onPointerDown={(e) => (lastPointer.current = e.pointerType)}
                onClick={() => {
                  // Hover already opened it for a mouse; touch and keyboard toggle.
                  const mouse = lastPointer.current === "mouse";
                  lastPointer.current = "";
                  if (panel === "all" && !mouse) close();
                  else open("all");
                }}
                aria-expanded={panel === "all"}
                aria-controls="all-menu"
                className="label flex items-center gap-1 py-2 text-ink/75 hover:text-ink"
              >
                {t.nav.all} <ChevronDownIcon size={14} className={`transition-transform ${panel === "all" ? "rotate-180" : ""}`} />
              </button>
            </li>
          </ul>
        </nav>

        {/* Centre: wordmark */}
        <Link href="/" className="flex flex-col items-center text-center" aria-label={`${storeName} home`}>
          <span className="font-serif text-2xl leading-none tracking-[0.12em] md:text-3xl">{storeName.toUpperCase()}</span>
          <span className="mt-1 hidden text-[10px] tracking-[0.25em] text-muted uppercase md:block">{tagline}</span>
        </Link>

        {/* Right: icons */}
        <div className="flex items-center justify-end gap-0.5 md:gap-1">
          <button type="button" className={iconBtn} aria-label={t.nav.search} onClick={() => open("search")}>
            <SearchIcon />
          </button>
          <LanguageToggle className="hidden px-2 md:block" />
          <Link href="/account" className={`${iconBtn} hidden md:flex`} aria-label={t.nav.account}>
            <UserIcon />
          </Link>
          <Link href="/account/wishlist" className={`${iconBtn} hidden md:flex`} aria-label={t.nav.wishlist}>
            <HeartIcon />
          </Link>
          <Link
            href="/cart"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || pathname === "/cart" || pathname === "/checkout") return;
              e.preventDefault();
              openDrawer();
            }}
            className={`${iconBtn} -mr-2`}
          >
            <BagIcon />
            {/* Name = "Cart, 2": includes the visible count (WCAG label-in-name). */}
            <span className="sr-only">{t.nav.cart}, </span>
            <span className="absolute top-1.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] leading-none text-white">{cartCount}</span>
          </Link>
        </div>
      </div>

      {/* "All" mega menu (desktop) */}
      {panel === "all" && (
        <div className="absolute inset-x-0 top-full hidden h-dvh bg-ink/20 xl:block" onClick={close} aria-hidden="true" />
      )}
      {panel === "all" && (
        <div id="all-menu" onPointerEnter={hoverOpen} onPointerLeave={hoverClose} className="absolute inset-x-0 top-full hidden border-b border-line bg-paper shadow-sm xl:block">
          <div className="mx-auto grid max-w-7xl grid-cols-4 gap-8 px-8 py-10">
            <div className="col-span-2">
              <p className="label text-muted">{t.nav.shopAll}</p>
              <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2">
                {allCategories.map((c) => (
                  <li key={c.href}><Link href={c.href} className="font-serif text-xl hover:underline">{c.name}</Link></li>
                ))}
              </ul>
            </div>
            <div className="col-span-2">
              <p className="label text-muted">{t.nav.collections}</p>
              <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2">
                {collections.map((c) => (
                  <li key={c.href}><Link href={c.href} className="font-serif text-xl hover:underline">{c.name}</Link></li>
                ))}
                <li><Link href="/shop" className="label mt-2 inline-block underline underline-offset-4">{t.nav.shopAll}</Link></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Search overlay */}
      {panel === "search" && (
        <div className="fixed inset-0 z-50 bg-ink/40" onClick={close}>
          <div role="dialog" aria-modal="true" aria-label={t.nav.search} className="max-h-[85vh] overflow-y-auto bg-paper" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 md:py-10">
              <SearchPanel onClose={close} />
            </div>
          </div>
        </div>
      )}

      {/* Mobile slide-in menu */}
      <div className={`fixed inset-0 z-50 xl:hidden ${panel === "menu" ? "" : "pointer-events-none"}`} aria-hidden={panel !== "menu"}>
        <div className={`absolute inset-0 bg-ink/40 transition-opacity ${panel === "menu" ? "opacity-100" : "opacity-0"}`} onClick={close} />
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          inert={panel !== "menu"}
          className={`absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-paper shadow-xl transition-transform duration-300 ${panel === "menu" ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <span className="font-serif text-xl tracking-[0.12em]">{storeName.toUpperCase()}</span>
            <button type="button" className={iconBtn} aria-label={t.nav.close} onClick={close}>
              <CloseIcon />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <ul>
              {allCategories.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} onClick={close} className="flex min-h-12 items-center border-b border-line font-serif text-xl">{c.name}</Link>
                </li>
              ))}
            </ul>
            <p className="label mt-8 text-muted">{t.nav.collections}</p>
            <ul className="mt-2">
              {collections.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} onClick={close} className="flex min-h-11 items-center text-sm">{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-3 border-t border-line text-center text-xs">
            <Link href="/account" onClick={close} className="flex min-h-14 flex-col items-center justify-center gap-1"><UserIcon size={18} />{t.nav.account}</Link>
            <Link href="/account/wishlist" onClick={close} className="flex min-h-14 flex-col items-center justify-center gap-1 border-x border-line"><HeartIcon size={18} />{t.nav.wishlist}</Link>
            <LanguageToggle className="min-h-14" />
          </div>
        </nav>
      </div>
    </header>
  );
}
