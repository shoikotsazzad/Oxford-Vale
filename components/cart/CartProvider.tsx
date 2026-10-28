"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { addToCart, getCart, removeFromCart, skipLead, submitLead, updateCartQty } from "@/server/actions/cart";
import type { ActionError, Result } from "@/server/result";
import type { CartView } from "@/lib/types";
import { CartDrawer } from "./CartDrawer";
import { LeadCaptureModal } from "./LeadCaptureModal";

type Ctx = {
  count: number;
  view: CartView | null;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  add: (variantId: string, qty: number) => Promise<ActionError | null>;
  setQty: (variantId: string, qty: number) => Promise<ActionError | null>;
  remove: (variantId: string) => Promise<ActionError | null>;
  apply: (view: CartView) => void;
};

const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ initialCount, children }: { initialCount: number; children: React.ReactNode }) {
  const [view, setView] = useState<CartView | null>(null);
  const [count, setCount] = useState(initialCount);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);

  const apply = useCallback((v: CartView) => {
    setView(v);
    setCount(v.count);
  }, []);

  const run = useCallback(
    async (p: Promise<Result<CartView>>) => {
      const res = await p;
      if (!res.ok) return res.error;
      apply(res.data);
      return null;
    },
    [apply],
  );

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    getCart().then((r) => r.ok && apply(r.data));
  }, [apply]);

  const add = useCallback(
    async (variantId: string, qty: number) => {
      const res = await addToCart({ variantId, qty });
      if (!res.ok) return res.error;
      apply(res.data);
      // First add: ask for contact details (skippable), then show the bag.
      if (res.data.needsLead) setLeadOpen(true);
      else setDrawerOpen(true);
      return null;
    },
    [apply],
  );

  const value = useMemo<Ctx>(
    () => ({
      count, view, drawerOpen, openDrawer, apply,
      closeDrawer: () => setDrawerOpen(false),
      add,
      setQty: (variantId, qty) => run(updateCartQty({ variantId, qty })),
      remove: (variantId) => run(removeFromCart(variantId)),
    }),
    [count, view, drawerOpen, openDrawer, apply, add, run],
  );

  const finishLead = (v: CartView) => {
    apply(v);
    setLeadOpen(false);
    setDrawerOpen(true);
  };

  return (
    <CartCtx.Provider value={value}>
      {children}
      <CartDrawer />
      {leadOpen && (
        <LeadCaptureModal
          onSubmit={async (data) => {
            const res = await submitLead(data);
            if (res.ok) finishLead(res.data);
            return res.ok ? null : res.error;
          }}
          onSkip={async () => {
            const res = await skipLead();
            if (res.ok) finishLead(res.data);
            else setLeadOpen(false);
          }}
        />
      )}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const v = useContext(CartCtx);
  if (!v) throw new Error("useCart must be used inside <CartProvider>");
  return v;
}
