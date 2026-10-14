import { NextResponse, type NextRequest } from "next/server";

// Project managers only ever reach active projects and the calendar.
const PM_ALLOWED = [/^\/projects(\/(?!new)[^/]+)?\/?$/, /^\/calendar/, /^\/more/, /^\/p\//];

export function middleware(req: NextRequest) {
  if (req.cookies.get("demo_user")?.value !== "u-pm") return NextResponse.next();
  const path = req.nextUrl.pathname;
  if (PM_ALLOWED.some((r) => r.test(path))) return NextResponse.next();
  return NextResponse.redirect(new URL("/projects", req.url));
}

export const config = { matcher: ["/((?!_next|api|.*\\..*).*)"] };
