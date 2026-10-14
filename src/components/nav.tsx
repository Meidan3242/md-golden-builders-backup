"use client";

import clsx from "clsx";
import { ArrowLeft, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BOTTOM, navFor } from "@/lib/nav-items";
import type { Role } from "@/lib/types";


function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SidebarNav({ role, badges }: { role: Role; badges: Record<string, number> }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {navFor(role).map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-white/10 text-white" : "text-sidebar-text/70 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className={clsx("size-4", active && "text-gold")} />
            <span className="flex-1">{label}</span>
            {!!badges[href] && <span className="gold-gradient rounded-full px-1.5 text-[10px] font-bold text-black">{badges[href]}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

/** Phone bottom bar: the main 4 + "More" with everything else (reports, settings, docs, map…). */
export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navFor(role);
  const main = items.filter((n) => BOTTOM.includes(n.href));
  const hasMore = items.length > main.length;
  const moreActive = pathname.startsWith("/more") || items.some((n) => !BOTTOM.includes(n.href) && isActive(pathname, n.href));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {main.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href) && !moreActive;
        return (
          <Link key={href} href={href} className={clsx("flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium", active ? "text-gold-text" : "text-muted")}>
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
      {hasMore && (
        <Link href="/more" className={clsx("flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium", moreActive ? "text-gold-text" : "text-muted")}>
          <Menu className="size-5" />
          More
        </Link>
      )}
    </nav>
  );
}

/** Back to the previous screen. Hidden on the home screen. */
export function BackButton({ home }: { home: string }) {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === home) return null;
  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(pathname.split("/").slice(0, -1).join("/") || home);
      }}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm font-medium hover:bg-surface"
      aria-label="Back"
    >
      <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Back</span>
    </button>
  );
}
