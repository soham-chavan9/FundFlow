import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

/**
 * Optimistic auth redirects only. It checks the cookie signature, not the
 * database; every page and action still calls requireUser() itself.
 */

const APP_PREFIXES = [
  "/dashboard",
  "/expenses",
  "/income",
  "/budgets",
  "/insights",
  "/shopping",
  "/assistant",
  "/settings",
];
const AUTH_PAGES = ["/login", "/register"];

const matches = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAppRoute = APP_PREFIXES.some((p) => matches(pathname, p));
  const isAuthPage = AUTH_PAGES.some((p) => matches(pathname, p));
  if (!isAppRoute && !isAuthPage) return NextResponse.next();

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (isAppRoute && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    const res = NextResponse.redirect(url);
    // Drop a forged or expired cookie so it is not re-sent.
    if (request.cookies.has(SESSION_COOKIE)) res.cookies.delete(SESSION_COOKIE);
    return res;
  }
  if (isAuthPage && session) {
    // The page found the signed token stale (password changed, account gone):
    // stay on the sign-in page and drop the cookie instead of looping.
    if (request.nextUrl.searchParams.has("expired")) {
      const res = NextResponse.next();
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
