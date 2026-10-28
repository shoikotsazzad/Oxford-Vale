"use client";
// Client-side so the footer year stays correct in cached/prerendered HTML.
export function Year() {
  return <span suppressHydrationWarning>{new Date().getFullYear()}</span>;
}
