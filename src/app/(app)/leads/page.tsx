import clsx from "clsx";
import { Eye, LayoutGrid, List, Plus, Upload } from "lucide-react";
import Link from "next/link";
import { LeadStageBadge, SourceBadge } from "@/components/status";
import { Avatar, Button, Card, PageHeader } from "@/components/ui";
import { canSeeMoney, currentUser, getLeads, userById } from "@/lib/data";
import { TODAY } from "@/lib/demo-data";
import { date, daysFrom, money } from "@/lib/format";
import { LEAD_SOURCES, LEAD_STAGES, PIPELINE_STAGES, type Lead } from "@/lib/types";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ view?: string; source?: string; stage?: string }> }) {
  const sp = await searchParams;
  const view = sp.view === "list" ? "list" : "board";
  const user = await currentUser();
  const showMoney = canSeeMoney(user);
  let leads = await getLeads();
  if (sp.source) leads = leads.filter((l) => l.source === sp.source);
  if (sp.stage) leads = leads.filter((l) => l.stage === sp.stage);

  const q = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { view, source: sp.source, stage: sp.stage, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/leads?${p}`;
  };

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle={user.role === "sales" ? "Only the leads assigned to you" : `${leads.length} leads · all sources`}
        actions={
          <>
            {user.role !== "sales" && <Button><Upload className="size-4" /> Import from monday</Button>}
            <Button variant="primary" href="/leads/new"><Plus className="size-4" /> New lead</Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
          <Link href={q({ view: "board" })} className={clsx("inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium", view === "board" ? "bg-surface text-text" : "text-muted")}><LayoutGrid className="size-3.5" /> Pipeline</Link>
          <Link href={q({ view: "list" })} className={clsx("inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium", view === "list" ? "bg-surface text-text" : "text-muted")}><List className="size-3.5" /> List</Link>
        </div>
        <div className="scrollbar-thin flex gap-1 overflow-x-auto">
          <Link href={q({ source: undefined })} className={clsx("rounded-full border px-2.5 py-1 text-xs", !sp.source ? "border-gold bg-gold-soft text-gold-text" : "border-border text-muted")}>All sources</Link>
          {LEAD_SOURCES.map((s) => (
            <Link key={s} href={q({ source: s })} className={clsx("whitespace-nowrap rounded-full border px-2.5 py-1 text-xs", sp.source === s ? "border-gold bg-gold-soft text-gold-text" : "border-border text-muted")}>{s}</Link>
          ))}
        </div>
      </div>

      {view === "board" ? <Board leads={leads} showMoney={showMoney} /> : <Table leads={leads} showMoney={showMoney} stage={sp.stage} q={q} />}
    </>
  );
}

function LeadCard({ l, showMoney }: { l: Lead; showMoney: boolean }) {
  const owner = userById(l.assignedTo);
  const age = -daysFrom(l.createdAt, TODAY);
  return (
    <Link href={`/leads/${l.id}`} className="block rounded-lg border border-border bg-card p-3 shadow-sm transition hover:border-gold">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-tight">{l.name}</span>
        {owner && <Avatar initials={owner.initials} />}
      </div>
      <div className="mt-0.5 text-xs text-muted">{l.service} · {l.city}</div>
      <div className="mt-2 flex items-center justify-between">
        <SourceBadge source={l.source} />
        <span className="text-[11px] text-muted">{age === 0 ? "today" : `${age}d ago`}</span>
      </div>
      {(l.estimateAmount || l.estimateViewedAt) && (
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs">
          {showMoney && l.estimateAmount ? <span className="font-semibold">{money(l.estimateAmount)}</span> : <span />}
          {l.estimateViewedAt && <span className="inline-flex items-center gap-1 text-ok"><Eye className="size-3" /> Viewed</span>}
        </div>
      )}
    </Link>
  );
}

function Board({ leads, showMoney }: { leads: Lead[]; showMoney: boolean }) {
  return (
    <div className="scrollbar-thin -mx-4 flex gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
      <NeedsAttention leads={leads} showMoney={showMoney} />
      {PIPELINE_STAGES.map((stage) => {
        const items = leads.filter((l) => l.stage === stage);
        const total = items.reduce((a, l) => a + (l.estimateAmount ?? 0), 0);
        return (
          <div key={stage} className="flex w-72 shrink-0 flex-col rounded-xl bg-surface p-2">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold">{stage} <span className="ml-1 text-muted">{items.length}</span></span>
              {showMoney && total > 0 && <span className="text-[11px] text-muted">{money(total)}</span>}
            </div>
            <div className="flex flex-col gap-2">
              {items.map((l) => <LeadCard key={l.id} l={l} showMoney={showMoney} />)}
              {!items.length && <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">No leads</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Table({ leads, showMoney, stage, q }: { leads: Lead[]; showMoney: boolean; stage?: string; q: (p: Record<string, string | undefined>) => string }) {
  return (
    <>
      <div className="scrollbar-thin mb-3 flex gap-1 overflow-x-auto">
        <Link href={q({ stage: undefined })} className={clsx("rounded-full border px-2.5 py-1 text-xs", !stage ? "border-gold bg-gold-soft text-gold-text" : "border-border text-muted")}>All stages</Link>
        {LEAD_STAGES.map((s) => (
          <Link key={s} href={q({ stage: s })} className={clsx("whitespace-nowrap rounded-full border px-2.5 py-1 text-xs", stage === s ? "border-gold bg-gold-soft text-gold-text" : "border-border text-muted")}>{s}</Link>
        ))}
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Service</th>
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium">Stage</th>
              {showMoney && <th className="px-4 py-2 text-right font-medium">Estimate</th>}
              <th className="px-4 py-2 font-medium">Created</th>
              <th className="px-4 py-2 font-medium">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-surface">
                <td className="px-4 py-2.5"><Link href={`/leads/${l.id}`} className="font-medium hover:underline">{l.name}</Link><div className="text-xs text-muted">{l.phone}</div></td>
                <td className="px-4 py-2.5">{l.service}<div className="text-xs text-muted">{l.city}</div></td>
                <td className="px-4 py-2.5"><SourceBadge source={l.source} /></td>
                <td className="px-4 py-2.5"><LeadStageBadge stage={l.stage} /></td>
                {showMoney && <td className="px-4 py-2.5 text-right font-medium">{l.estimateAmount ? money(l.estimateAmount) : "—"}</td>}
                <td className="px-4 py-2.5 text-muted">{date(l.createdAt)}</td>
                <td className="px-4 py-2.5 text-muted">{userById(l.assignedTo)?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

/** Leads that need a human decision: not contacted in time, or released after 7 days of silence. */
function NeedsAttention({ leads, showMoney }: { leads: Lead[]; showMoney: boolean }) {
  const items = leads.filter(
    (l) => l.stage === "No Response" || (l.stage === "New" && -daysFrom(l.createdAt, TODAY) >= 1) || (l.stage === "Trying to Reach" && (l.attempts ?? 0) >= 4),
  );
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl border border-bad/30 bg-bad-soft/40 p-2">
      <div className="mb-2 px-1">
        <span className="text-xs font-semibold text-bad">Needs attention <span className="ml-1">{items.length}</span></span>
        <div className="text-[10px] text-muted">Not contacted in time · last attempts · released (no reply 7 days)</div>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((l) => (
          <div key={l.id}>
            <div className="mb-0.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-bad">
              {l.stage === "No Response" ? "Released — no response" : l.stage === "New" ? "Not contacted yet" : `Attempt ${l.attempts} of 5`}
            </div>
            <LeadCard l={l} showMoney={showMoney} />
          </div>
        ))}
      </div>
    </div>
  );
}
