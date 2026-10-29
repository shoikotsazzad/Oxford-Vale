import { site } from "@/data/site";

/** Absolute site URL for provider return/cancel links. */
export const baseUrl = () => (process.env.APP_URL || site.url).replace(/\/$/, "");
