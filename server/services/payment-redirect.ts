import { orderKey } from "@/server/crypto";
import { site } from "@/data/site";

const base = () => process.env.APP_URL || site.url;

/** 303 so the browser follows a POST callback with a GET. */
export const redirect303 = (path: string) => Response.redirect(new URL(path, base()), 303);
export const orderUrl = (orderNo: string, extra = "") => `/order/${orderNo}?key=${orderKey(orderNo)}${extra}`;
export const payUrl = (orderNo: string, extra = "") => `/checkout/pay/${orderNo}?key=${orderKey(orderNo)}${extra}`;

export async function formParams(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return (await request.json()) as Record<string, string>;
  const fd = await request.formData();
  return Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)]));
}
