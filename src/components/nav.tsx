"use client";

import clsx from "clsx";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  FileText,
  FolderKanban,
  HardHat,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/follow-ups", label: "Follow-ups", icon: ListTodo },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/documents/new", label: "Documents", icon: FileText },
  { href: "/payments", label: "Payments", icon: CreditCard, money: true },
  { href: "/subcontractors", label: "Subcontractors", icon: HardHat },
  { href: "/reports", label: "Reports", icon: BarChart3, money: true },
  { href: "/inbox", label: "Inbox", icon: MessageSquare, soon: true },
  { href: "/settings", label: "Settings", icon: Settings, adminOnly: true },
];

const MOBILE = ["/", "/leads", "/calendar", "/projects", "/payments"];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SidebarNav({ showMoney, isAdmin, badges }: { showMoney: boolean; isAdmin: boolean; badges: Record<string, number> }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.filter((n) => (showMoney || !n.money) && (isAdmin || !n.adminOnly)).map(({ href, label, icon: Icon, soon }) => {
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
            {soon && <span className="rounded bg-white/10 px-1.5 text-[10px] text-sidebar-text/70">Soon</span>}
            {!!badges[href] && <span className="gold-gradient rounded-full px-1.5 text-[10px] font-bold text-black">{badges[href]}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ showMoney }: { showMoney: boolean }) {
  const pathname = usePathname();
  const items = NAV.filter((n) => MOBILE.includes(n.href) && (showMoney || !n.money));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link key={href} href={href} className={clsx("flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium", active ? "text-gold-text" : "text-muted")}>
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
