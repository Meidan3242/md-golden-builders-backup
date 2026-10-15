import { NextResponse, type NextRequest } from "next/server";
import { authSecret, SESSION_COOKIE, verifySession } from "@/lib/session";

// Customer pages (estimates, contracts, payment, emails) stay open — customers open them from a link.
const PUBLIC = [/^\/login/, /^\/p\//];
// Project managers only ever reach active projects and the calendar.
const PM_ALLOWED = [/^\/projects(\/(?!new)[^/]+)?\/?$/, /^\/files\//, /^\/calendar/, /^\/more/, /^\/p\//];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (PUBLIC.some((r) => r.test(path))) return NextResponse.next();

  const userId = await verifySession(req.cookies.get(SESSION_COOKIE)?.value, authSecret());
  if (!userId) {
    const url = new URL("/login", req.url);
    if (path !== "/") url.searchParams.set("next", path + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (userId === "u-pm" && !PM_ALLOWED.some((r) => r.test(path))) return NextResponse.redirect(new URL("/projects", req.url));
  return NextResponse.next();
}

// Every path goes through the login check except Next's own build files and the named public files
// (logo, icons, app manifest, robots, the blank contract form images used on the demo customer pages).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|manifest\\.webmanifest|sw\\.js|logo-dark\\.png|logo-light\\.png|icon-192\\.png|icon-512\\.png|apple-touch-icon\\.png|license-cslb\\.jpg|forms/).*)"],
};
