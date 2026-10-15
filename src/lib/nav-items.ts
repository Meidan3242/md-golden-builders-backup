import {
  BarChart3,
  CalendarDays,
  CreditCard,
  FileText,
  FolderKanban,
  KeyRound,
  HardHat,
  LayoutDashboard,
  Map,
  Settings,
  Users,
} from "lucide-react";
import type { Role } from "./types";

type Item = { href: string; label: string; icon: typeof Users; roles?: Role[] };

const STAFF: Role[] = ["admin", "office", "sales"];
const MONEY: Role[] = ["admin", "office"];

/** Every section of the app and who may open it. Shared by the sidebar, the phone bar and "More". */
export const NAV: Item[] = [
  { href: "/", label: "Home", icon: LayoutDashboard, roles: STAFF },
  { href: "/leads", label: "Leads", icon: Users, roles: STAFF },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/map", label: "Map", icon: Map, roles: STAFF },
  { href: "/documents/new", label: "Documents", icon: FileText, roles: STAFF },
  { href: "/payments", label: "Payments", icon: CreditCard, roles: MONEY },
  { href: "/subcontractors", label: "Subcontractors", icon: HardHat, roles: STAFF },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: MONEY },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
  { href: "/account", label: "My account", icon: KeyRound },
];

export const BOTTOM = ["/", "/leads", "/calendar", "/projects"];
export const navFor = (role: Role) => NAV.filter((n) => !n.roles || n.roles.includes(role));
