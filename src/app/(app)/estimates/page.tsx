import clsx from "clsx";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Card, Empty, PageHeader } from "@/components/ui";
import { canSeeAll, canSeeMoney, currentUser, getLeads } from "@/lib/data";
import { allEstimates } from "@/lib/estimates";
import { date, money } from "@/lib/format";

type Status = "Draft" | "Sent" | "Viewed" | "Approved";
/** One row of the table: an estimate made in the app, or one sent before the app (Joist / monday) that is on a lead. */
type Row = {
  key: string;
  href: string;
  number?: number;
  customer: string;
  phone: string;
  email: string;
  address: string;
  job: string;
  lead?: string;
  total: number;
  status: Status;
  date: string;
  older: boolean;
};

const TABS = [
  { key: "sent", label: "Sent", has: (r: Row) => r.status !== "Draft" },
  { key: "waiting", label: "Waiting for an answer", has: (r: Row) => r.status === "Sent" || r.status === "Viewed" },
  { key: "approved", label: "Approved", has: (r: Row) => r.status === "Approved" },
  { key: "drafts", label: "Drafts", has: (r: Row) => r.status === "Draft" },
  { key: "all", label: "All", has: () => true },
] as const;
const tone = (s: Status) => (s === "Approved" ? "ok" : s === "Draft" ? "neutral" : s === "Viewed" ? "info" : "gold");

type SP = { tab?: string; q?: string };

/** Every estimate that went out — made in the app, or sent earlier from Joist (on the lead) — plus drafts. */
export default async function EstimatesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await currentUser();
  if (user.role === "pm") notFound();
  const showMoney = canSeeMoney(user);
  const [all, leads] = await Promise.all([allEstimates(), getLeads()]);
  const leadById = new Map(leads.map((l) => [l.id, l]));
  // Owner / office see everything; a sales rep sees the estimates of their own leads.
  const app = canSeeAll(user) ? all : all.filter((e) => e.leadId && leadById.has(e.leadId));
  const rows: Row[] = app.map((e) => ({
    key: e.id,
    href: `/estimates/${e.id}`,
    number: e.number,
    customer: e.customer.name,
    phone: e.customer.phone,
    email: e.customer.email,
    address: e.customer.address,
    job: e.title,
    lead: e.leadId ? leadById.get(e.leadId)?.name : undefined,
    total: e.total,
    status: e.status,
    date: e.approvedAt ?? e.viewedAt ?? e.sentAt ?? e.createdAt,
    older: false,
  }));
  // Sent before the app: the lead has the amount / date (and usually the Joist PDF), but no estimate made here.
  const inApp = new Set(app.filter((e) => e.sentAt && e.leadId).map((e) => e.leadId));
  for (const l of leads) {
    const sent = l.estimateSentAt ?? (l.estimateAmount && ["Estimate Sent", "Won"].includes(l.stage) ? l.createdAt : undefined);
    if (!sent || inApp.has(l.id)) continue;
    rows.push({
      key: `L-${l.id}`,
      href: `/leads/${l.id}`,
      customer: l.name,
      phone: l.phone,
      email: l.email ?? "",
      address: [l.address, l.city].filter(Boolean).join(", "),
      job: l.service,
      lead: l.name,
      total: l.estimateAmount ?? 0,
      status: l.stage === "Won" || l.projectId ? "Approved" : l.estimateViewedAt ? "Viewed" : "Sent",
      date: sent,
      older: true,
    });
  }
  rows.sort((a, b) => b.date.localeCompare(a.date));

  const tab = TABS.find((t) => t.key === sp.tab) ?? TABS[0];
  const q = (sp.q ?? "").trim().toLowerCase();
  const qDigits = q.replace(/\D/g, "");
  const shown = rows
    .filter(tab.has)
    .filter((r) => !q || [r.customer, r.email, r.address, r.job, r.lead, r.number ? `#${r.number}` : ""].some((x) => x?.toLowerCase().includes(q)) || (qDigits.length >= 4 && r.phone.replace(/\D/g, "").includes(qDigits)));
  const href = (patch: SP) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
    return `/estimates${p.size ? `?${p}` : ""}`;
  };
  const chip = (active: boolean) => clsx("whitespace-nowrap rounded-full border px-3 py-1 text-xs", active ? "border-gold bg-gold-soft font-semibold text-gold-text" : "border-border text-muted");
  const sum = (rs: Row[]) => rs.reduce((a, r) => a + r.total, 0);

  return (
    <>
      <PageHeader
        title="Estimates"
        subtitle={showMoney ? `${shown.length} estimates · ${money(sum(shown))}${tab.key === "sent" ? ` · ${money(sum(shown.filter((r) => r.status === "Approved")))} approved` : ""}` : `${shown.length} estimates`}
        actions={canSeeAll(user) && <Button variant="primary" href="/estimates/new"><Plus className="size-4" /> New estimate</Button>}
      />

      <form action="/estimates" className="mb-3 flex max-w-md items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
        {sp.tab && <input type="hidden" name="tab" value={sp.tab} />}
        <Search className="size-4 text-muted" />
        <input name="q" defaultValue={sp.q} placeholder="Customer, phone, address, job or #" className="min-w-0 flex-1 bg-transparent py-0.5 text-sm outline-none" />
      </form>
      <div className="scrollbar-thin mb-4 flex gap-1 overflow-x-auto pb-0.5">
        {TABS.map((t) => <Link key={t.key} href={href({ tab: t.key === "sent" ? undefined : t.key })} className={chip(tab.key === t.key)}>{t.label} {rows.filter(t.has).length}</Link>)}
      </div>

      <Card className="overflow-hidden">
        {!shown.length ? (
          <Empty>{rows.length ? "No estimates here." : canSeeAll(user) ? "No estimates yet — tap New estimate." : "No estimates yet."}</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead className="hidden border-b border-border bg-surface text-left text-xs text-muted md:table-header-group">
              <tr>
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Job</th>
                {showMoney && <th className="px-4 py-2 text-right font-medium">Total</th>}
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">{tab.key === "drafts" ? "Created" : "Sent / updated"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((r) => (
                <tr key={r.key} className="relative flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 hover:bg-surface md:table-row md:p-0">
                  <td className="order-1 text-xs text-muted md:px-4 md:py-2.5">
                    <Link href={r.href} className="after:absolute after:inset-0">{r.number ? `#${r.number}` : <span title="Sent before the app (Joist) — opens the lead">Joist</span>}</Link>
                  </td>
                  <td className="order-2 min-w-0 flex-1 truncate font-medium md:px-4 md:py-2.5">{r.customer}</td>
                  <td className="order-5 w-full truncate text-xs text-muted md:w-auto md:px-4 md:py-2.5 md:text-sm md:text-text">{r.job}</td>
                  {showMoney && <td className="order-3 text-right font-semibold md:px-4 md:py-2.5">{r.total ? money(r.total) : "—"}</td>}
                  <td className="order-4 md:px-4 md:py-2.5"><Badge tone={tone(r.status)}>{r.status}</Badge></td>
                  <td className="order-6 ml-auto text-xs text-muted md:ml-0 md:px-4 md:py-2.5">{date(r.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
