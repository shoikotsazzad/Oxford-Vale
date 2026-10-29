import { orderKey } from "@/server/crypto";
import { baseUrl } from "@/server/adapters/payments/base";

/** 303 so the browser follows a POST callback with a GET. */
export const redirect303 = (path: string) => Response.redirect(new URL(path, baseUrl()), 303);
export const orderUrl = (orderNo: string, extra = "") => `/order/${orderNo}?key=${orderKey(orderNo)}${extra}`;
export const payUrl = (orderNo: string, extra = "") => `/checkout/pay/${orderNo}?key=${orderKey(orderNo)}${extra}`;
