import "server-only";
import { cookies } from "next/headers";

export const CART_COOKIE = "ov_cart";

export async function getCartToken(): Promise<string | undefined> {
  return (await cookies()).get(CART_COOKIE)?.value;
}

/** Only callable from server actions / route handlers. */
export async function setCartToken(token: string) {
  (await cookies()).set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
