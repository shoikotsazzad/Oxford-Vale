import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/account", "/cart", "/checkout", "/order/"] },
    sitemap: new URL("/sitemap.xml", site.url).toString(),
  };
}
