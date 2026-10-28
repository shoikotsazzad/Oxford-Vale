"use client";
import { useTransition } from "react";
import { HeartIcon } from "@/components/ui/icons";
import { useWishlist } from "./WishlistProvider";

export function WishlistButton({ productId, label, className = "" }: { productId: string; label: string; className?: string }) {
  const { has, toggle } = useWishlist();
  const [pending, start] = useTransition();
  const on = has(productId);
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      disabled={pending}
      onClick={() => start(() => toggle(productId))}
      className={`flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-white/80 ${className}`}
    >
      <HeartIcon size={18} fill={on ? "currentColor" : "none"} />
    </button>
  );
}
