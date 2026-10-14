import clsx from "clsx";
import { BarChart3, FileClock, ListTodo, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EstimateEntry } from "@/components/estimate-entry";
import { LeadList, type LeadRow } from "@/components/lead-list";
import { LeadsReport } from "@/components/leads-report";
import { monthlyStats, monthsOfYear } from "@/lib/lead-stats";
import { LeadStageBadge, SourceBadge } from "@/components/status";
import { BackLink, Button, Card, Tile } from "@/components/ui";
import { canSeeMoney, currentUser, getAppointments, getFollowUps, getLeads } from "@/lib/data";
import { dbReady } from "@/lib/db";
import { now } from "@/lib/clock";
import { date, dateTime, dayKey, daysFrom, money } from "@/lib/format";
import { LEAD_SOURCES, RELEASE_AFTER_DAYS, type Lead } from "@/lib/types";

const age = (l: Lead) => -daysFrom(l.createdAt, now());
const SOLD = (l: Lead) => l.stage === "Won" || !!l.projectId;

type SP = { box?: string; source?: string; year?: string; month?: string; result?: string };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await currentUser();
  const showMoney = canSeeMoney(user);
  const leads = await getLeads();

  if (sp.box === "all") {
    const today = now();
    const thisYear = Number(dayKey(today.toISOString()).slice(0, 4));
    const years = [...new Set([thisYear, ...leads.map((l) => Number(dayKey(l.createdAt).slice(0, 4)))])].sort((a, b) => b - a);
    const year = years.includes(Number(sp.year)) ? Number(sp.year) : thisYear;
    const months = monthsOfYear(year, today);
    const d = Number(dayKey(today.toISOString()).slice(8, 10));
    const spendMonths = year === thisYear ? months.length - 1 + d / 31 : months.length;
    return <LeadsReport showMoney={showMoney} history={monthlyStats(leads, months)} year={year} years={years} spendMonths={spendMonths} />;
  }
  if (sp.box === "list") return <AllLeadsTable leads={leads} sp={sp} showMoney={showMoney} />;
  if (sp.box === "need-estimate") {
    const rows = leads
      .filter((l) => l.stage === "Need to Send Estimate")
      .map((l) => ({ id: l.id, name: l.name, source: l.source, service: l.service, city: l.city, visited: date(l.createdAt), days: Math.max(1, age(l) - 3) }));
    return (
      <>
        <BackLink href="/leads" label="Leads" />
        <h1 className="text-2xl font-bold tracking-tight">Need to send estimate <span className="text-muted">{rows.length}</span></h1>
        <p className="mb-4 text-sm text-muted">We visited — type the price, attach the Joist PDF, tap Estimate sent. Follow-ups start by themselves.</p>
        <EstimateEntry rows={rows} />
      </>
    );
  }
  if (sp.box) notFound();

  const today = dayKey(now());
  const [followUps, appts] = await Promise.all([getFollowUps(), getAppointments()]);
  // The week starts Monday — "became a meeting" resets every week.
  const weekday = (now().getUTCDay() + 6) % 7;
  const weekStart = dayKey(new Date(now().getTime() - weekday * 86_400_000).toISOString());
  const dayLabel = (iso: string) => {
    const k = dayKey(iso);
    return k === today ? "Today" : -daysFrom(iso, now()) === 1 ? "Yesterday" : date(iso);
  };
  const lastLine = (l: Lead) => {
    const m = (l.thread ?? []).at(-1);
    return m ? `${m.from === "customer" ? "💬" : "↩"} ${m.text}` : undefined;
  };
  const row = (l: Lead, status: string, tone: LeadRow["tone"], dayIso = l.createdAt): LeadRow => ({
    id: l.id, name: l.name, source: l.source, service: l.service, city: l.city, phone: l.phone, day: dayLabel(dayIso), status, tone, last: lastLine(l),
  });

  const secondMeetings = leads.filter((l) => l.stage === "Second Meeting" && !l.closedAt).map((l) => {
    const a = appts.find((x) => x.leadId === l.id);
    return row(l, a ? `2nd meeting ${dateTime(a.start)}` : "2nd meeting", "gold", a?.start ?? l.createdAt);
  });
  const open: LeadRow[] = [
    ...secondMeetings,
    ...leads
      .filter((l) => !l.closedAt && age(l) < RELEASE_AFTER_DAYS && ["New", "Trying to Reach", "Talking"].includes(l.stage))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((l) =>
        l.stage === "New" ? row(l, "Not called yet", "bad")
        : l.stage === "Talking" ? row(l, "Talking", "ok")
        : row(l, `No answer · try ${l.attempts ?? 1} of 5`, "warn"),
      ),
  ];
  // Closed this week: tapped ✓ (or booked a meeting) since Monday.
  const closedOn = (l: Lead) => l.closedAt ?? (l.stage === "Appointment Set" ? l.createdAt : undefined);
  const closedThisWeek = leads.filter((l) => { const c = closedOn(l); return c && dayKey(c) >= weekStart; });
  const closed = closedThisWeek.map((l) => ({ ...row(l, l.stage === "Appointment Set" ? "Meeting booked ✓" : "Closed ✓", "ok"), closedOn: dayLabel(closedOn(l)!) }));
  const cameInToday = leads.filter((l) => dayKey(l.createdAt) === today);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <Button variant="primary" href="/leads/new"><Plus className="size-4" /> New lead</Button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-gold/50 bg-gold-soft/40 p-4">
          <div className="text-sm text-muted">Came in today</div>
          <div className="text-4xl font-bold">{cameInToday.length}</div>
          <div className="mt-1 flex flex-wrap gap-2">{cameInToday.map((l) => <SourceBadge key={l.id} source={l.source} />)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-sm text-muted">Became a meeting</div>
          <div className="text-4xl font-bold text-ok">{closed.length}</div>
          <div className="text-xs text-muted">this week · resets Monday</div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <Tile href="/leads?box=need-estimate" icon={<FileClock />} title="Need estimate" count={leads.filter((l) => l.stage === "Need to Send Estimate").length} tone="gold" />
        <Tile href="/follow-ups" icon={<ListTodo />} title="Follow-ups" count={followUps.filter((f) => !f.done && dayKey(f.due) <= today).length} />
        <Tile href="/leads?box=all" icon={<BarChart3 />} title="All leads" />
      </div>

      <LeadList open={open} closed={closed} demo={!(await dbReady())} />
    </>
  );
}

/** Every lead ever, with filters: platform, year, month, sold or not. Grouped by month. */
function AllLeadsTable({ leads, sp, showMoney }: { leads: Lead[]; sp: SP; showMoney: boolean }) {
  const ym = (l: Lead) => dayKey(l.createdAt).slice(0, 7);
  const years = [...new Set(leads.map((l) => ym(l).slice(0, 4)))].sort().reverse();
  const monthsOfYear = [...new Set(leads.filter((l) => !sp.year || ym(l).startsWith(sp.year)).map(ym))].sort().reverse();
  const rows = leads
    .filter((l) => !sp.source || l.source === sp.source)
    .filter((l) => !sp.year || ym(l).startsWith(sp.year))
    .filter((l) => !sp.month || ym(l) === sp.month)
    .filter((l) => !sp.result || (sp.result === "sold" ? SOLD(l) : !SOLD(l)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const byMonth = rows.reduce<Record<string, Lead[]>>((acc, l) => ((acc[ym(l)] ??= []).push(l), acc), {});
  const monthName = (m: string) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const q = (patch: Partial<SP>) => {
    const p = new URLSearchParams({ box: "list" });
    for (const [k, v] of Object.entries({ ...sp, box: "list", ...patch })) if (v) p.set(k, v);
    return `/leads?${p}`;
  };
  const chip = (active: boolean) => clsx("whitespace-nowrap rounded-full border px-3 py-1 text-xs", active ? "border-gold bg-gold-soft font-semibold text-gold-text" : "border-border text-muted");
  const sources = LEAD_SOURCES.filter((s) => leads.some((l) => l.source === s));
  const sold = rows.filter(SOLD);

  return (
    <>
      <BackLink href="/leads?box=all" label="All leads" />
      <h1 className="text-2xl font-bold tracking-tight">Every lead <span className="text-muted">{rows.length}</span></h1>
      <p className="mb-3 text-sm text-muted">Filter by platform, year and month</p>

      <div className="mb-4 space-y-2">
        {[
          ["Platform", [<Link key="all" href={q({ source: undefined })} className={chip(!sp.source)}>All</Link>, ...sources.map((s) => <Link key={s} href={q({ source: s })} className={chip(sp.source === s)}>{s}</Link>)]],
          ["Year", [<Link key="all" href={q({ year: undefined, month: undefined })} className={chip(!sp.year)}>All</Link>, ...years.map((y) => <Link key={y} href={q({ year: y, month: undefined })} className={chip(sp.year === y)}>{y}</Link>)]],
          ["Month", [<Link key="all" href={q({ month: undefined })} className={chip(!sp.month)}>All</Link>, ...monthsOfYear.map((m) => <Link key={m} href={q({ month: m })} className={chip(sp.month === m)}>{monthName(m).split(" ")[0]}</Link>)]],
          ["Result", [<Link key="all" href={q({ result: undefined })} className={chip(!sp.result)}>All</Link>, <Link key="s" href={q({ result: "sold" })} className={chip(sp.result === "sold")}>Sold</Link>, <Link key="n" href={q({ result: "not" })} className={chip(sp.result === "not")}>Not sold</Link>]],
        ].map(([label, chips]) => (
          <div key={label as string} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-xs font-medium text-muted">{label as string}</span>
            <div className="scrollbar-thin flex gap-1 overflow-x-auto pb-0.5">{chips as React.ReactNode}</div>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {Object.entries(byMonth).map(([m, ls]) => (
            <Card key={m} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-4 py-2 text-sm">
                <b>{monthName(m)}</b>
                <span className="text-xs text-muted">{ls.length} leads · <b className="text-ok">{ls.filter(SOLD).length} sold</b></span>
              </div>
              <ul className="divide-y divide-border">
                {ls.map((l) => (
                  <li key={l.id}>
                    <Link href={`/leads/${l.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 hover:bg-surface">
                      <span className="w-14 text-xs text-muted">{date(l.createdAt)}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{l.name} <span className="font-normal text-muted">· {l.service}</span></span>
                      <SourceBadge source={l.source} />
                      {showMoney && l.estimateAmount ? <span className="text-xs font-semibold">{money(l.estimateAmount)}</span> : null}
                      <LeadStageBadge stage={l.stage} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
          {!rows.length && <Card className="p-8 text-center text-sm text-muted">No leads match</Card>}
        </div>

        <Card className="p-4 lg:sticky lg:top-20">
          <div className="text-sm font-semibold">These {rows.length} leads</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-surface p-2"><div className="text-xl font-bold">{rows.filter((l) => l.estimateSentAt).length}</div><div className="text-[11px] text-muted">estimates</div></div>
            <div className="rounded-lg bg-ok-soft p-2"><div className="text-xl font-bold text-ok">{sold.length}</div><div className="text-[11px] text-muted">sold</div></div>
          </div>
          {showMoney && <div className="mt-2 text-center text-sm">Sold <b>{money(sold.reduce((a, l) => a + (l.estimateAmount ?? 0), 0))}</b></div>}
          <div className="mt-3 text-xs font-semibold text-muted">By platform</div>
          <ul className="mt-1 space-y-1 text-sm">
            {sources.map((s) => {
              const ls = rows.filter((l) => l.source === s);
              if (!ls.length) return null;
              return (
                <li key={s} className="flex items-center justify-between gap-2">
                  <SourceBadge source={s} />
                  <span className="text-xs"><b>{ls.length}</b> leads · <b className="text-ok">{ls.filter(SOLD).length}</b> sold</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}
