import { CalendarDays, FileClock, FileText, FolderKanban, PhoneCall } from "lucide-react";
import Link from "next/link";
import { PhoneNotifications } from "@/components/notifications";
import { SalesGoal } from "@/components/sales-goal";
import { Tile } from "@/components/ui";
import { canSeeMoney, currentUser, getAppointments, getLeads, getProjects, isActive } from "@/lib/data";
import { CHANNELS, MONTHLY_HISTORY, SALES_GOAL_DEFAULT } from "@/lib/demo-data";
import { dbReady } from "@/lib/db";
import { lastMonths, monthlyStats } from "@/lib/lead-stats";
import { now } from "@/lib/clock";
import { dayKey, daysFrom, time } from "@/lib/format";

/** Home: what needs doing today, two boxes, and the monthly sales goal. */
export default async function Home() {
  const user = await currentUser();
  const [leads, projects, appts] = await Promise.all([getLeads(), getProjects(), getAppointments()]);
  const showMoney = canSeeMoney(user);
  const today = dayKey(now());

  const notCalled = leads.filter((l) => l.stage === "New");
  const active = projects.filter(isActive);
  const todaysAppts = appts.filter((a) => dayKey(a.start) === today);
  const needEstimate = leads.filter((l) => l.stage === "Need to Send Estimate");
  const oldest = needEstimate.reduce((a, l) => Math.max(a, -daysFrom(l.createdAt, now())), 0);
  // Real data: sold leads by month. Demo: the sample history.
  const history = (await dbReady()) ? monthlyStats(leads, lastMonths(7, now())) : MONTHLY_HISTORY;
  const months = history.map((h) => ({
    month: h.month,
    sold: CHANNELS.reduce((a, c) => a + h.channels[c].soldValue, 0),
    jobs: CHANNELS.reduce((a, c) => a + h.channels[c].sold, 0),
  }));

  return (
    <>
      <div className="mb-5">
        <div className="text-sm text-muted">{now().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
        <h1 className="text-2xl font-bold tracking-tight">Good morning, {user.name.split(" ")[0]}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/leads" className="rounded-2xl border-2 border-bad/40 bg-bad-soft/40 p-4 transition hover:border-bad">
          <div className="flex items-center gap-1.5 text-sm font-medium text-bad"><PhoneCall className="size-4" /> Leads to call</div>
          <div className="mt-1 text-4xl font-bold">{notCalled.length}</div>
          <div className="text-xs text-muted">Came in and nobody called yet</div>
        </Link>
        <Link href="/projects?box=ongoing" className="rounded-2xl border-2 border-gold/50 bg-gold-soft/40 p-4 transition hover:border-gold">
          <div className="flex items-center gap-1.5 text-sm font-medium text-gold-text"><FolderKanban className="size-4" /> Active projects</div>
          <div className="mt-1 text-4xl font-bold">{active.length}</div>
          <div className="text-xs text-muted">Signed and not finished</div>
        </Link>
      </div>

      <div className="mt-3 rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5 text-sm font-semibold"><CalendarDays className="size-4 text-gold-text" /> Today&apos;s meetings</div>
        <ul className="divide-y divide-border">
          {todaysAppts.map((a) => (
            <li key={a.id}>
              <Link href={a.leadId ? `/leads/${a.leadId}` : `/projects/${a.projectId}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface">
                <span className="w-16 text-sm font-bold">{time(a.start)}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{a.title}</span>
                <span className="text-xs text-muted">{a.confirmation}</span>
              </Link>
            </li>
          ))}
          {!todaysAppts.length && <li className="px-4 py-4 text-center text-sm text-muted">No meetings today</li>}
        </ul>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Tile href="/leads?box=need-estimate" icon={<FileClock />} title="Estimates to send" count={needEstimate.length} tone={needEstimate.length ? "gold" : undefined} hint={needEstimate.length ? `Visited, no estimate yet · oldest ${oldest} days` : "All sent"} />
        <Tile href="/documents/new" icon={<FileText />} title="New document" hint="Estimate · contract · change order" />
      </div>

      {(user.role === "admin" || user.role === "office") && (
        <div className="mt-3">
          <PhoneNotifications />
        </div>
      )}

      {showMoney && (
        <div className="mt-3">
          <SalesGoal months={months} initialGoal={SALES_GOAL_DEFAULT} />
        </div>
      )}
    </>
  );
}
