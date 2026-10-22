"use client";

import { useSyncExternalStore } from "react";

// Read on the client only: Cache Components disallows reading the current time during prerender.
const noop = () => () => {};

export function Year() {
  const year = useSyncExternalStore(noop, () => new Date().getFullYear(), () => null);
  return <span>{year}</span>;
}
