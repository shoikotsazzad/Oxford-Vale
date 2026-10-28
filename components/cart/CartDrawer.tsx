"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { ButtonLink } from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatBDT } from "@/lib/money";
import { useCart } from "./CartProvider";
import { CartLines, CartNotices, FreeDeliveryBar } from "./CartLines";

export function CartDrawer() {
  const { t } = useI18n();
  const { drawerOpen, closeDrawer, view } = useCart();
  const pathname = usePathname();

  // Close when navigating away.
  useEffect(() => {
    closeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, closeDrawer]);

  return (
    <div className={`fixed inset-0 z-50 ${drawerOpen ? "" : "pointer-events-none"}`} aria-hidden={!drawerOpen}>
      <div className={`absolute inset-0 bg-ink/40 transition-opacity ${drawerOpen ? "opacity-100" : "opacity-0"}`} onClick={closeDrawer} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t.cart.title}
        inert={!drawerOpen}
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper shadow-xl transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <p className="font-serif text-xl">
            {t.cart.title}
            {view && view.count > 0 && <span className="ml-2 text-sm text-muted">({view.count})</span>}
          </p>
          <button type="button" onClick={closeDrawer} aria-label={t.nav.close} className="flex h-11 w-11 items-center justify-center"><CloseIcon /></button>
        </div>

        {!view ? (
          <div className="space-y-4 p-5">{[0, 1].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : view.lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="font-serif text-2xl">{t.cart.empty}</p>
            <p className="mt-2 text-sm text-muted">{t.cart.emptyText}</p>
            <ButtonLink href="/shop" className="mt-6" arrow>{t.home.shopNow}</ButtonLink>
          </div>
        ) : (
          <>
            <div className="border-b border-line px-5 py-4"><FreeDeliveryBar gap={view.freeDeliveryGap} threshold={view.freeDeliveryThreshold} /></div>
            <div className="flex-1 overflow-y-auto px-5">
              {view.notices.length > 0 && <div className="pt-4"><CartNotices notices={view.notices} /></div>}
              <CartLines lines={view.lines} compact onNavigate={closeDrawer} />
            </div>
            <div className="border-t border-line p-5">
              <div className="flex items-baseline justify-between">
                <span className="label">{t.cart.subtotal}</span>
                <span className="text-lg">{formatBDT(view.subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{t.cart.deliveryNote}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <ButtonLink href="/cart" variant="secondary">{t.cart.viewCart}</ButtonLink>
                <ButtonLink href="/checkout" arrow>{t.cart.checkout}</ButtonLink>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
