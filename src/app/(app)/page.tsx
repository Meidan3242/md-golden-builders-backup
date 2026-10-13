import { CalendarDays, CreditCard, FileText, FolderKanban, HardHat, Map, PhoneCall, Send, Users } from "lucide-react";
import Link from "next/link";
import { Tile } from "@/components/ui";
import { canSeeMoney, currentUser, getAppointments, getLeads, getProjects } from "@/lib/data";
import { TODAY } from "@/lib/demo-data";
import { compactMoney, dayKey, time } from "@/lib/format";

/** Home: two numbers that matter today, then boxes that take you everywhere else. */
export default async function Home() {
  const user = await currentUser();
  const [leads, projects, appts] = await Promise.all([getLeads(), getProjects(), getAppointments()]);
  const showMoney = canSeeMoney(user);
  const today = dayKey(TODAY);

  const notCalled = leads.filter((l) => l.stage === "New");
  const active = projects.filter((p) => p.stage !== "Completed");
  const todaysAppts = appts.filter((a) => dayKey(a.start) === today);
  const estimates = leads.filter((l) => l.stage === "Estimate Sent" || l.stage === "Second Meeting");
  const all = projects.flatMap((p) => [...p.milestones, ...p.changeOrders.filter((c) => c.status === "Signed").flatMap((c) => c.milestones)]);
  const toCollect = all.filter((m) => m.status === "Invoiced" || m.status === "Overdue");
  const subPays = projects.flatMap((p) => [...p.subs, ...p.changeOrders.flatMap((c) => c.subs)]).flatMap((a) => a.payments).filter((x) => x.status === "Requested");
  const sum = (xs: { amount: number }[]) => xs.reduce((a, x) => a + x.amount, 0);

  return (
    <>
      <div className="mb-5">
        <div className="text-sm text-muted">{TODAY.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
        <h1 className="text-2xl font-bold tracking-tight">Good morning, {user.name.split(" ")[0]}</h1>
      </div>

      {/* The two numbers that matter today */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/leads?box=new" className="rounded-2xl border-2 border-bad/40 bg-bad-soft/40 p-4 transition hover:border-bad">
          <div className="flex items-center gap-1.5 text-sm font-medium text-bad"><PhoneCall className="size-4" /> Leads to call</div>
          <div className="mt-1 text-4xl font-bold">{notCalled.length}</div>
          <div className="text-xs text-muted">Came in and nobody called yet</div>
        </Link>
        <Link href="/projects" className="rounded-2xl border-2 border-gold/50 bg-gold-soft/40 p-4 transition hover:border-gold">
          <div className="flex items-center gap-1.5 text-sm font-medium text-gold-text"><FolderKanban className="size-4" /> Active projects</div>
          <div className="mt-1 text-4xl font-bold">{active.length}</div>
          <div className="text-xs text-muted">Signed and not finished</div>
        </Link>
      </div>

      {todaysAppts.length > 0 && (
        <Link href="/calendar" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm hover:border-gold">
          <CalendarDays className="size-4 text-gold-text" />
          <b>Today:</b>
          {todaysAppts.map((a) => <span key={a.id} className="text-muted">{time(a.start)} {a.title.split(" — ")[1] ?? a.title}</span>)}
        </Link>
      )}

      <h2 className="mb-3 mt-6 text-sm font-semibold text-muted">Go to</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Tile href="/leads" icon={<Users />} title="Leads" count={leads.filter((l) => ["New", "Trying to Reach", "Appointment Set", "Need to Send Estimate"].includes(l.stage)).length} hint="Calls, visits, new customers" />
        <Tile href="/leads?box=estimate-sent" icon={<Send />} title="Estimates" count={estimates.length} hint={showMoney ? `${compactMoney(sum(estimates.map((l) => ({ amount: l.estimateAmount ?? 0 }))))} waiting on a yes` : "Waiting on a yes"} />
        <Tile href="/projects" icon={<FolderKanban />} title="Projects" count={active.length} hint="Everything we are building" />
        {showMoney && <Tile href="/payments" icon={<CreditCard />} title="Collect from customers" count={toCollect.length} hint={`${compactMoney(sum(toCollect))} invoiced, not paid`} tone={toCollect.length ? "gold" : undefined} />}
        {showMoney && <Tile href="/payments#subs" icon={<HardHat />} title="Pay subcontractors" count={subPays.length} hint={`${compactMoney(sum(subPays))} requested`} tone={subPays.length ? "bad" : undefined} />}
        <Tile href="/calendar" icon={<CalendarDays />} title="Calendar" count={todaysAppts.length} hint="Appointments today" />
        <Tile href="/documents/new" icon={<FileText />} title="New document" hint="Estimate · contract · change order" />
        <Tile href="/map" icon={<Map />} title="Map" hint="All jobs on the map" />
        <Tile href="/subcontractors" icon={<HardHat />} title="Subcontractors" hint="Contacts, licenses, insurance" />
      </div>
    </>
  );
}
