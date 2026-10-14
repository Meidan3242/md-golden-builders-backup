import { NextResponse, type NextRequest } from "next/server";
import { authSecret, SESSION_COOKIE, verifySession, VIEW_AS_COOKIE } from "@/lib/session";

// Customer pages (estimates, contracts, payment, emails) stay open — customers open them from a link.
const PUBLIC = [/^\/login/, /^\/p\//];
// Project managers only ever reach active projects and the calendar.
const PM_ALLOWED = [/^\/projects(\/(?!new)[^/]+)?\/?$/, /^\/calendar/, /^\/more/, /^\/p\//];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (PUBLIC.some((r) => r.test(path))) return NextResponse.next();

  const userId = await verifySession(req.cookies.get(SESSION_COOKIE)?.value, authSecret());
  if (!userId) {
    const url = new URL("/login", req.url);
    if (path !== "/") url.searchParams.set("next", path + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // The owner may preview the app as another role; everyone else is always themselves.
  const viewAs = req.cookies.get(VIEW_AS_COOKIE)?.value;
  const effective = userId === "u-owner" && viewAs ? viewAs : userId;
  if (effective === "u-pm" && !PM_ALLOWED.some((r) => r.test(path))) return NextResponse.redirect(new URL("/projects", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|api|.*\\..*).*)"] };
