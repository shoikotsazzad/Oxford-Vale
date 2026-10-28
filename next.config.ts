import { existsSync, readdirSync } from "node:fs";
import type { NextConfig } from "next";

// Brand photos present at build time (public/brand/). BrandImage shows its fallback for missing ones without
// requesting them, so there are no 404s until the photos are added (restart dev / rebuild after adding files).
const brandFiles = existsSync("public/brand") ? readdirSync("public/brand").filter((f) => !f.startsWith(".")) : [];

// Baseline security headers on every route. Payment pages only redirect (no iframes), so framing is denied everywhere.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  env: { NEXT_PUBLIC_BRAND_FILES: brandFiles.join("|") },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
