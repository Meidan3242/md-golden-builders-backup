import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { LogoutButton, ThemeToggle, UserSwitcher } from "@/components/header-controls";
import { BackButton, MobileNav, SidebarNav } from "@/components/nav";
import { Avatar } from "@/components/ui";
import { allUsers, currentUser, getFollowUps, loggedInUser } from "@/lib/data";
import { TODAY } from "@/lib/demo-data";
import { dayKey } from "@/lib/format";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const me = await loggedInUser();
  const followUps = await getFollowUps();
  const dueToday = followUps.filter((f) => !f.done && dayKey(f.due) <= dayKey(TODAY)).length;
  const home = user.role === "pm" ? "/projects" : "/";

  return (
    <div className="min-h-screen md:pl-60">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col bg-sidebar p-3 md:flex">
        <Link href={home} className="mb-5 block px-2 pt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dark.png" alt="MD Golden Builders" className="h-auto w-40" />
        </Link>
        <SidebarNav role={user.role} badges={{ "/leads": dueToday }} />
        <div className="mt-auto flex items-center gap-2 rounded-lg bg-white/5 p-2.5">
          <Avatar initials={user.initials} className="size-8 text-xs" />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-white">{user.name}</div>
            <div className="text-[11px] text-sidebar-text/60">{user.title}</div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-bg/90 px-4 py-2.5 backdrop-blur md:px-6">
        <BackButton home={home} />
        <Link href={home} className="md:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.png" alt="MD Golden Builders" className="h-8 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dark.png" alt="" className="hidden h-8 w-auto dark:block" />
        </Link>
        <div className="hidden max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted md:flex">
          <Search className="size-4" />
          Search leads, projects, phone numbers…
        </div>
        <div className="ml-auto flex items-center gap-2">
          {me?.role === "admin" && <UserSwitcher users={allUsers()} current={user.id} />}
          <ThemeToggle />
          <LogoutButton />
          {user.role !== "pm" && <Link href="/leads/new" className="gold-gradient hidden items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-black sm:inline-flex">
            <Plus className="size-4" /> New lead
          </Link>}
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 pt-5 pb-24 md:px-6 md:pb-10">{children}</main>
      <MobileNav role={user.role} />
    </div>
  );
}
