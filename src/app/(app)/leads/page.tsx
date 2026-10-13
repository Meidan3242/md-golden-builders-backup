import { Archive, CalendarCheck, FileClock, Inbox, ListTodo, PhoneCall, PhoneForwarded, Plus, Send, Trophy, Users, UserX } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadStageBadge, SourceBadge } from "@/components/status";
import { BackLink, Button, Card, Tile } from "@/components/ui";
import { canSeeMoney, currentUser, getAppointments, getFollowUps, getLeads, userById } from "@/lib/data";
import { TODAY } from "@/lib/demo-data";
import { date, dayKey, daysFrom, money, time } from "@/lib/format";
import type { Lead, LeadStage } from "@/lib/types";

/** Every box on the leads page, in the order a lead moves through them. */
const BOXES: { key: string; title: string; hint: string; stages: LeadStage[]; icon: React.ReactNode; tone?: "bad" | "gold" | "ok" }[] = [
  { key: "new", title: "New — not called yet", hint: "Call them first", stages: ["New"], icon: <PhoneCall />, tone: "bad" },
  { key: "trying", title: "Trying to reach", hint: "Called, no answer yet", stages: ["Trying to Reach"], icon: <PhoneForwarded /> },
  { key: "appointment", title: "Appointment set", hint: "Site visit booked", stages: ["Appointment Set"], icon: <CalendarCheck /> },
  { key: "need-estimate", title: "Need to send estimate", hint: "Visited, estimate not sent", stages: ["Need to Send Estimate"], icon: <FileClock />, tone: "gold" },
  { key: "estimate-sent", title: "Estimate sent", hint: "Follow up — get a second meeting", stages: ["Estimate Sent"], icon: <Send /> },
  { key: "second-meeting", title: "Second meeting", hint: "Close the deal", stages: ["Second Meeting"], icon: <Users /> },
  { key: "won", title: "Won", hint: "Became a project", stages: ["Won"], icon: <Trophy />, tone: "ok" },
  { key: "closed", title: "Paused / lost", hint: "Paused, not a fit, lost", stages: ["Paused", "Not a Fit", "Lost"], icon: <Archive /> },
  { key: "no-answer", title: "No answer (7 days)", hint: "Released — out of every list", stages: ["No Response"], icon: <UserX /> },
];

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ box?: string }> }) {
  const { box } = await searchParams;
  const user = await currentUser();
  const showMoney = canSeeMoney(user);
  const leads = await getLeads();

  if (box) {
    const b = box === "all" ? { title: "All leads", hint: "Everything still being worked", stages: null } : BOXES.find((x) => x.key === box);
    if (!b) notFound();
    const rows = b.stages ? leads.filter((l) => b.stages!.includes(l.stage)) : leads.filter((l) => l.stage !== "No Response");
    return (
      <>
        <BackLink href="/leads" label="Leads" />
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{b.title} <span className="text-muted">{rows.length}</span></h1>
            <p className="text-sm text-muted">{b.hint}</p>
          </div>
          <Button variant="primary" href="/leads/new"><Plus className="size-4" /> New lead</Button>
        </div>
        <LeadTable leads={rows} showMoney={showMoney} />
      </>
    );
  }

  const today = dayKey(TODAY);
  const [appts, followUps] = await Promise.all([getAppointments(), getFollowUps()]);
  const cameInToday = leads.filter((l) => dayKey(l.createdAt) === today);
  const followUpsToday = followUps.filter((f) => !f.done && dayKey(f.due) <= today);

  // "My leads today": who I need to talk to today, in one short list.
  const todayList: { l: Lead; what: string; urgent?: boolean }[] = [
    ...appts.filter((a) => dayKey(a.start) === today && a.leadId).map((a) => ({ l: leads.find((x) => x.id === a.leadId)!, what: `${a.type} at ${time(a.start)}` })),
    ...leads.filter((l) => l.stage === "New").map((l) => ({ l, what: "Call — not called yet", urgent: true })),
    ...leads.filter((l) => l.stage === "Trying to Reach").map((l) => ({ l, what: `Try again — attempt ${(l.attempts ?? 0) + 1} of 5` })),
    ...followUpsToday.map((f) => ({ l: leads.find((x) => x.id === f.leadId)!, what: `Follow-up ${f.step}` })),
  ].filter((x, i, arr) => x.l && arr.findIndex((y) => y.l?.id === x.l.id) === i);
  const SHOW = 7;

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Leads</h1>

      <div className="grid items-start gap-3 lg:grid-cols-[220px_1fr]">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <Link href="/leads/new" className="gold-gradient flex flex-col justify-center rounded-2xl p-4 text-black shadow-sm lg:min-h-36">
            <Plus className="size-7" />
            <div className="mt-1 text-lg font-bold">New lead</div>
            <div className="text-xs opacity-80">Phone, Yelp, Thumbtack…</div>
          </Link>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 text-sm text-muted"><Inbox className="size-4" /> Came in today</div>
            <div className="mt-1 text-4xl font-bold">{cameInToday.length}</div>
            <div className="text-xs text-muted">{cameInToday.map((l) => l.source).join(" · ") || "None yet"}</div>
          </div>
        </div>

        <Card>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-semibold">My leads today <span className="text-muted">{todayList.length}</span></h2>
            <span className="text-xs text-muted">Who to talk to today</span>
          </div>
          <ul className="divide-y divide-border">
            {todayList.slice(0, SHOW).map(({ l, what, urgent }, i) => (
              <li key={`${l.id}-${i}`}>
                <Link href={`/leads/${l.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface">
                  <span className={urgent ? "size-2 shrink-0 rounded-full bg-bad" : "size-2 shrink-0 rounded-full bg-gold"} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{l.name} <span className="font-normal text-muted">· {l.service}</span></div>
                    <div className={urgent ? "text-xs font-medium text-bad" : "text-xs text-muted"}>{what}</div>
                  </div>
                  <span className="hidden text-xs text-muted sm:block">{l.city}</span>
                </Link>
              </li>
            ))}
          </ul>
          {todayList.length > SHOW && <div className="border-t border-border px-4 py-2.5 text-center text-xs text-muted">+{todayList.length - SHOW} more — they're in the boxes below</div>}
        </Card>
      </div>

      <h2 className="mb-3 mt-6 text-sm font-semibold text-muted">All leads by step — tap a box to open the list</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {BOXES.map((b) => {
          const n = leads.filter((l) => b.stages.includes(l.stage)).length;
          return <Tile key={b.key} href={`/leads?box=${b.key}`} icon={b.icon} title={b.title} count={n} hint={b.hint} tone={n ? b.tone : undefined} />;
        })}
        <Tile href="/follow-ups" icon={<ListTodo />} title="Follow-ups" count={followUpsToday.length} hint="Due today" />
        <Tile href="/leads?box=all" icon={<Users />} title="All leads" count={leads.filter((l) => l.stage !== "No Response").length} hint="One big table" />
      </div>
    </>
  );
}

function LeadTable({ leads, showMoney }: { leads: Lead[]; showMoney: boolean }) {
  if (!leads.length) return <Card className="p-8 text-center text-sm text-muted">Nothing here right now</Card>;
  return (
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
          {leads.map((l) => {
            const age = -daysFrom(l.createdAt, TODAY);
            return (
              <tr key={l.id} className="hover:bg-surface">
                <td className="px-4 py-2.5"><Link href={`/leads/${l.id}`} className="font-medium hover:underline">{l.name}</Link><div className="text-xs text-muted">{l.phone}</div></td>
                <td className="px-4 py-2.5">{l.service}<div className="text-xs text-muted">{l.city}</div></td>
                <td className="px-4 py-2.5"><SourceBadge source={l.source} /></td>
                <td className="px-4 py-2.5"><LeadStageBadge stage={l.stage} /></td>
                {showMoney && <td className="px-4 py-2.5 text-right font-medium">{l.estimateAmount ? money(l.estimateAmount) : "—"}</td>}
                <td className="px-4 py-2.5 text-muted">{age === 0 ? "Today" : date(l.createdAt)}</td>
                <td className="px-4 py-2.5 text-muted">{userById(l.assignedTo)?.name}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
