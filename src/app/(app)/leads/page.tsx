import clsx from "clsx";
import { BarChart3, CalendarCheck, Check, FileClock, ListTodo, MessageSquare, Plus, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadsReport } from "@/components/leads-report";
import { LeadStageBadge, SourceBadge } from "@/components/status";
import { BackLink, Button, Card, Tile } from "@/components/ui";
import { canSeeMoney, currentUser, getFollowUps, getLeads, userById } from "@/lib/data";
import { TODAY } from "@/lib/demo-data";
import { date, dayKey, daysFrom, money } from "@/lib/format";
import { RELEASE_AFTER_DAYS, type Lead, type LeadStage } from "@/lib/types";

const BOXES: Record<string, { title: string; hint: string; stages: LeadStage[] }> = {
  "need-estimate": { title: "Need to send estimate", hint: "We visited — the estimate didn't go out yet", stages: ["Need to Send Estimate"] },
  "second-meeting": { title: "Second meeting", hint: "Close the deal", stages: ["Second Meeting"] },
};

/** The weekly list: every lead from the last 7 days, until it books a meeting, is completed, or goes quiet for a week. */
const VIEWS = {
  open: { label: "Still open", stages: ["New", "Trying to Reach", "Talking"] as LeadStage[] },
  meeting: { label: "Became a meeting", stages: ["Appointment Set"] as LeadStage[] },
  complete: { label: "Completed", stages: ["Paused", "Not a Fit", "Lost"] as LeadStage[] },
  dropped: { label: `No answer ${RELEASE_AFTER_DAYS} days`, stages: ["No Response"] as LeadStage[] },
};

const age = (l: Lead) => -daysFrom(l.createdAt, TODAY);

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ box?: string; view?: string }> }) {
  const { box, view = "open" } = await searchParams;
  const user = await currentUser();
  const showMoney = canSeeMoney(user);
  const leads = await getLeads();

  if (box === "all") return <LeadsReport showMoney={showMoney} />;
  if (box === "list") return <ListPage title="Every lead" hint="All leads ever, newest first" rows={leads} showMoney={showMoney} back="/leads?box=all" backLabel="All leads" />;
  if (box) {
    const b = BOXES[box];
    if (!b) notFound();
    return <ListPage title={b.title} hint={b.hint} rows={leads.filter((l) => b.stages.includes(l.stage))} showMoney={showMoney} back="/leads" backLabel="Leads" />;
  }

  const today = dayKey(TODAY);
  const followUps = await getFollowUps();
  const week = leads.filter((l) => age(l) < RELEASE_AFTER_DAYS || (l.stage === "No Response" && age(l) < 2 * RELEASE_AFTER_DAYS));
  const cameInToday = leads.filter((l) => dayKey(l.createdAt) === today);
  const v = VIEWS[view as keyof typeof VIEWS] ?? VIEWS.open;
  const rows = week.filter((l) => v.stages.includes(l.stage)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const byDay = rows.reduce<Record<string, Lead[]>>((acc, l) => ((acc[dayKey(l.createdAt)] ??= []).push(l), acc), {});
  const dayLabel = (k: string) => (k === today ? "Today" : -daysFrom(`${k}T19:00:00Z`, TODAY) === 1 ? "Yesterday" : date(`${k}T19:00:00Z`));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted">This week — last {RELEASE_AFTER_DAYS} days</p>
        </div>
        <Button variant="primary" href="/leads/new"><Plus className="size-4" /> New lead</Button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4">
        <div className="col-span-3 rounded-2xl border-2 border-gold/50 bg-gold-soft/40 p-4 md:col-span-1">
          <div className="text-sm text-muted">Came in today</div>
          <div className="text-4xl font-bold">{cameInToday.length}</div>
          <div className="mt-1 flex flex-wrap gap-2">{cameInToday.map((l) => <SourceBadge key={l.id} source={l.source} />)}</div>
        </div>
        {(Object.keys(VIEWS) as (keyof typeof VIEWS)[]).filter((k) => k !== "open").map((k) => (
          <Link key={k} href={`/leads?view=${k}`} className={clsx("rounded-2xl border bg-card p-3 hover:border-gold sm:p-4", view === k ? "border-gold" : "border-border")}>
            <div className="text-xs text-muted sm:text-sm">{VIEWS[k].label}</div>
            <div className={clsx("text-3xl font-bold", k === "meeting" && "text-ok", k === "dropped" && "text-muted")}>{week.filter((l) => VIEWS[k].stages.includes(l.stage)).length}</div>
            <div className="text-[11px] text-muted">this week</div>
          </Link>
        ))}
      </div>

      <div className="scrollbar-thin mb-3 flex gap-1 overflow-x-auto">
        {(Object.keys(VIEWS) as (keyof typeof VIEWS)[]).map((k) => (
          <Link key={k} href={`/leads?view=${k}`} className={clsx("whitespace-nowrap rounded-full border px-3 py-1 text-sm", (VIEWS[k] === v) ? "border-gold bg-gold-soft font-semibold text-gold-text" : "border-border text-muted")}>
            {VIEWS[k].label} <span className="opacity-70">{week.filter((l) => VIEWS[k].stages.includes(l.stage)).length}</span>
          </Link>
        ))}
      </div>

      <Card className="overflow-hidden">
        {Object.entries(byDay).map(([k, ls]) => (
          <div key={k}>
            <div className="border-b border-border bg-surface px-4 py-1.5 text-xs font-semibold text-muted">{dayLabel(k)} · {ls.length}</div>
            <ul className="divide-y divide-border border-b border-border">
              {ls.map((l) => <WeekRow key={l.id} l={l} open={v === VIEWS.open} />)}
            </ul>
          </div>
        ))}
        {!rows.length && <div className="p-8 text-center text-sm text-muted">Nothing here this week</div>}
        {v === VIEWS.open && (
          <div className="px-4 py-2.5 text-[11px] text-muted">
            Tap <b>Meeting</b> when they book — they move to the calendar. Tap <b>Complete</b> when they&apos;re done for now (e.g. next year). No answer for {RELEASE_AFTER_DAYS} days → they drop off by themselves.
          </div>
        )}
      </Card>

      <h2 className="mb-3 mt-6 text-sm font-semibold text-muted">After the meeting</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile href="/leads?box=need-estimate" icon={<FileClock />} title="Need to send estimate" count={leads.filter((l) => l.stage === "Need to Send Estimate").length} tone="gold" hint="Visited, no estimate yet" />
        <Tile href="/leads?box=second-meeting" icon={<Users />} title="Second meeting" count={leads.filter((l) => l.stage === "Second Meeting").length} hint="Close the deal" />
        <Tile href="/follow-ups" icon={<ListTodo />} title="Estimate follow-ups" count={followUps.filter((f) => !f.done && dayKey(f.due) <= today).length} hint="Due today" />
        <Tile href="/leads?box=all" icon={<BarChart3 />} title="All leads" hint="By month, channel, sales" />
      </div>
    </>
  );
}

const STATUS: Partial<Record<LeadStage, { label: (l: Lead) => string; cls: string }>> = {
  New: { label: () => "Not called yet", cls: "bg-bad-soft text-bad" },
  "Trying to Reach": { label: (l) => `No answer · try ${l.attempts ?? 1} of 5`, cls: "bg-warn-soft text-warn" },
  Talking: { label: () => "Talking", cls: "bg-ok-soft text-ok" },
  "Appointment Set": { label: () => "Meeting booked", cls: "bg-gold-soft text-gold-text" },
  "No Response": { label: () => "Dropped — no answer", cls: "bg-surface text-muted" },
};

function WeekRow({ l, open }: { l: Lead; open: boolean }) {
  const st = STATUS[l.stage] ?? { label: () => l.stage, cls: "bg-surface text-muted" };
  const last = (l.thread ?? []).at(-1);
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <Link href={`/leads/${l.id}`} className="min-w-0 flex-1 basis-56">
        <div className="flex items-center gap-2">
          <span className="font-semibold hover:underline">{l.name}</span>
          <SourceBadge source={l.source} />
        </div>
        <div className="truncate text-xs text-muted">{l.service} · {l.city} · {l.phone}</div>
        {last && <div className="mt-0.5 truncate text-xs text-muted">{last.from === "customer" ? "💬 " : "↩ "}{last.text}</div>}
      </Link>
      <span className={clsx("rounded-full px-2.5 py-1 text-xs font-semibold", st.cls)}>{st.label(l)}</span>
      {open && (
        <div className="flex gap-1.5">
          <Link href={`/leads/${l.id}`} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-surface"><MessageSquare className="size-3.5" /> Message</Link>
          <button className="inline-flex items-center gap-1 rounded-lg bg-ok px-2.5 py-1.5 text-xs font-semibold text-white"><CalendarCheck className="size-3.5" /> Meeting</button>
          <button className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-surface"><Check className="size-3.5" /> Complete</button>
        </div>
      )}
    </li>
  );
}

function ListPage({ title, hint, rows, showMoney, back, backLabel }: { title: string; hint: string; rows: Lead[]; showMoney: boolean; back: string; backLabel: string }) {
  return (
    <>
      <BackLink href={back} label={backLabel} />
      <h1 className="text-2xl font-bold tracking-tight">{title} <span className="text-muted">{rows.length}</span></h1>
      <p className="mb-4 text-sm text-muted">{hint}</p>
      {rows.length ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Service</th>
                <th className="px-4 py-2 font-medium">Source</th>
                <th className="px-4 py-2 font-medium">Step</th>
                {showMoney && <th className="px-4 py-2 text-right font-medium">Estimate</th>}
                <th className="px-4 py-2 font-medium">Came in</th>
                <th className="px-4 py-2 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((l) => (
                <tr key={l.id} className="hover:bg-surface">
                  <td className="px-4 py-2.5"><Link href={`/leads/${l.id}`} className="font-medium hover:underline">{l.name}</Link><div className="text-xs text-muted">{l.phone}</div></td>
                  <td className="px-4 py-2.5">{l.service}<div className="text-xs text-muted">{l.city}</div></td>
                  <td className="px-4 py-2.5"><SourceBadge source={l.source} /></td>
                  <td className="px-4 py-2.5"><LeadStageBadge stage={l.stage} /></td>
                  {showMoney && <td className="px-4 py-2.5 text-right font-medium">{l.estimateAmount ? money(l.estimateAmount) : "—"}</td>}
                  <td className="px-4 py-2.5 text-muted">{age(l) === 0 ? "Today" : date(l.createdAt)}</td>
                  <td className="px-4 py-2.5 text-muted">{userById(l.assignedTo)?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="p-8 text-center text-sm text-muted">Nothing here right now</Card>
      )}
    </>
  );
}
