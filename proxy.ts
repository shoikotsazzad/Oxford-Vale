import { NextResponse, type NextRequest } from "next/server";

// Optimistic redirect only: real checks run in every account/admin page and server action.
const PUBLIC_ACCOUNT = ["/account/login", "/account/register", "/account/forgot-password", "/account/reset-password"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has("ov_session");

  if (pathname.startsWith("/account") && !PUBLIC_ACCOUNT.some((p) => pathname.startsWith(p)) && !hasSession) {
    const url = new URL("/account/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !hasSession) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/account/:path*", "/admin/:path*"] };
