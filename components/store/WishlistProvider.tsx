"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toggleWishlist } from "@/server/actions/account";

type Ctx = { loggedIn: boolean; has: (id: string) => boolean; toggle: (id: string) => Promise<void> };
const WishCtx = createContext<Ctx | null>(null);

export function WishlistProvider({ initialIds, loggedIn, children }: { initialIds: string[]; loggedIn: boolean; children: React.ReactNode }) {
  const [ids, setIds] = useState(() => new Set(initialIds));
  const router = useRouter();
  const pathname = usePathname();

  const toggle = useCallback(
    async (id: string) => {
      if (!loggedIn) {
        router.push(`/account/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      // Optimistic, then reconcile with the server.
      setIds((s) => {
        const n = new Set(s);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      });
      const res = await toggleWishlist(id);
      if (res.ok) setIds(new Set(res.data.ids));
      else if (res.error.code === "UNAUTHORIZED") router.push(`/account/login?next=${encodeURIComponent(pathname)}`);
    },
    [loggedIn, router, pathname],
  );

  const value = useMemo(() => ({ loggedIn, has: (id: string) => ids.has(id), toggle }), [ids, loggedIn, toggle]);
  return <WishCtx.Provider value={value}>{children}</WishCtx.Provider>;
}

export function useWishlist() {
  const v = useContext(WishCtx);
  if (!v) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return v;
}
