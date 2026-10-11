import { AlertTriangle, ArrowRight, PhoneCall } from "lucide-react";
import Link from "next/link";
import { ConfirmBadge, LeadStageBadge, ProjectStageBadge, sourceColor } from "@/components/status";
import { Badge, Card, CardHeader, PageHeader, Progress, Stat } from "@/components/ui";
import {
  canSeeMoney,
  currentUser,
  getAppointments,
  getFollowUps,
  getLeads,
  getProjects,
  projectAlerts,
  projectFinancials,
} from "@/lib/data";
import { TODAY } from "@/lib/demo-data";
import { compactMoney, date, dayKey, money, time } from "@/lib/format";
import { LEAD_SOURCES } from "@/lib/types";

export default async function Dashboard() {
  const user = await currentUser();
  const [leads, projects, appts, followUps] = await Promise.all([getLeads(), getProjects(), getAppointments(), getFollowUps()]);
  const showMoney = canSeeMoney(user);

  const openEstimates = leads.filter((l) => l.stage === "Estimate Sent" || l.stage === "Second Meeting");
  const openEstimateValue = openEstimates.reduce((a, l) => a + (l.estimateAmount ?? 0), 0);
  const active = projects.filter((p) => p.stage !== "Completed");
  const fin = active.map((p) => ({ p, f: projectFinancials(p) }));
  const outstanding = fin.reduce((a, x) => a + x.f.invoiced, 0);
  const subRequested = fin.reduce((a, x) => a + x.f.subRequested, 0);
  const todayStr = dayKey(TODAY);
  const todaysAppts = appts.filter((a) => dayKey(a.start) === todayStr);
  const upcoming = appts.filter((a) => dayKey(a.start) > todayStr).slice(0, 5);
  const due = followUps.filter((f) => !f.done && dayKey(f.due) <= todayStr);
  const newLeads = leads.filter((l) => l.stage === "New");
  const alerts = active.flatMap((p) => projectAlerts(p).map((a) => ({ p, a }))).slice(0, 6);
  const bySource = LEAD_SOURCES.map((s) => ({ s, n: leads.filter((l) => l.source === s).length })).filter((x) => x.n);
  const maxSource = Math.max(...bySource.map((x) => x.n));

  return (
    <>
      <PageHeader
        title={`Good morning, ${user.name.split(" ")[0]}`}
        subtitle={`${TODAY.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · ${todaysAppts.length} appointments today · ${due.length} follow-ups due`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="New leads to call" value={newLeads.length} hint="Waiting for first contact" tone={newLeads.length ? "bad" : undefined} />
        <Stat label="Open estimates" value={showMoney ? compactMoney(openEstimateValue) : openEstimates.length} hint={`${openEstimates.length} estimates waiting on a decision`} tone="gold" />
        <Stat label="Active projects" value={active.length} hint={`${projects.filter((p) => p.stage === "Waiting on Permit").length} waiting on permit`} />
        {showMoney ? (
          <Stat label="Invoiced, not yet paid" value={compactMoney(outstanding)} hint={`Subs requesting ${money(subRequested)}`} />
        ) : (
          <Stat label="Follow-ups due" value={due.length} />
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Follow-ups due today"
            subtitle="Estimate sent → Day 1 & Day 3 call + text. Goal: book a second meeting."
            action={<Link href="/follow-ups" className="text-xs font-medium text-gold-text">View all →</Link>}
          />
          <ul className="divide-y divide-border">
            {due.slice(0, 6).map((f) => {
              const l = leads.find((x) => x.id === f.leadId)!;
              return (
                <li key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Badge tone="gold">{f.step}</Badge>
                  <div className="min-w-0 flex-1">
                    <Link href={`/leads/${l.id}`} className="text-sm font-medium hover:underline">{l.name}</Link>
                    <div className="truncate text-xs text-muted">{l.service} · {showMoney && l.estimateAmount ? money(l.estimateAmount) : ""} · {f.action}</div>
                  </div>
                  <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-surface">
                    <PhoneCall className="size-3.5" /> Call
                  </a>
                </li>
              );
            })}
            {!due.length && <li className="px-4 py-6 text-center text-sm text-muted">All caught up 🎉</li>}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Upcoming appointments" subtitle="Customers get an SMS the day before: reply 1 to confirm" action={<Link href="/calendar" className="text-xs font-medium text-gold-text">Calendar →</Link>} />
          <ul className="divide-y divide-border">
            {[...todaysAppts, ...upcoming].slice(0, 6).map((a) => (
              <li key={a.id} className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{a.title}</span>
                  <ConfirmBadge c={a.confirmation} />
                </div>
                <div className="text-xs text-muted">{dayKey(a.start) === todayStr ? "Today" : date(a.start)} · {time(a.start)} · {a.type}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Active projects" action={<Link href="/projects" className="text-xs font-medium text-gold-text">All projects →</Link>} />
          <ul className="divide-y divide-border">
            {fin.map(({ p, f }) => (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{p.customer} <span className="text-muted">· {p.type}</span></div>
                    <div className="text-xs text-muted">{p.address}, {p.city}</div>
                  </div>
                  <ProjectStageBadge stage={p.stage} />
                  {showMoney && (
                    <div className="w-full sm:w-44">
                      <div className="mb-1 flex justify-between text-[11px] text-muted"><span>Collected</span><span>{compactMoney(f.collected)} / {compactMoney(f.revenue)}</span></div>
                      <Progress value={f.collected / f.revenue} />
                    </div>
                  )}
                  <ArrowRight className="hidden size-4 text-muted sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex flex-col gap-4">
          {showMoney && (
            <Card>
              <CardHeader title="Needs attention" />
              <ul className="divide-y divide-border">
                {alerts.map(({ p, a }, i) => (
                  <li key={i} className="flex gap-2 px-4 py-2 text-xs">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warn" />
                    <span><Link href={`/projects/${p.id}`} className="font-medium hover:underline">{p.customer}</Link> — {a}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card>
            <CardHeader title="Leads by source" subtitle="Every lead must have a source" />
            <div className="space-y-2 p-4">
              {bySource.map(({ s, n }) => (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <span className="w-20 shrink-0 font-medium">{s}</span>
                  <div className="h-2 flex-1 rounded-full bg-surface">
                    <div className="h-2 rounded-full" style={{ width: `${(n / maxSource) * 100}%`, background: sourceColor(s) }} />
                  </div>
                  <span className="w-6 text-right text-muted">{n}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader title="Newest leads" action={<Link href="/leads" className="text-xs font-medium text-gold-text">All leads →</Link>} />
        <ul className="divide-y divide-border">
          {leads.slice(0, 5).map((l) => (
            <li key={l.id}>
              <Link href={`/leads/${l.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface">
                <span className="size-2 rounded-full" style={{ background: sourceColor(l.source) }} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{l.name} <span className="font-normal text-muted">· {l.service} · {l.city}</span></span>
                <LeadStageBadge stage={l.stage} />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
