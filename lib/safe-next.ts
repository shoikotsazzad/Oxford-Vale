/** Only allow relative in-site redirects (e.g. after login). */
export const safeNext = (next: unknown, fallback = "/account") =>
  typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
