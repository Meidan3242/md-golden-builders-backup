import clsx from "clsx";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Card, Empty, PageHeader } from "@/components/ui";
import { canSeeAll, canSeeMoney, currentUser, getLeads } from "@/lib/data";
import { allEstimates, type Estimate } from "@/lib/estimates";
import { date, money } from "@/lib/format";

const STATUSES = ["Draft", "Sent", "Viewed", "Approved"] as const;
const tone = (s: Estimate["status"]) => (s === "Approved" ? "ok" : s === "Draft" ? "neutral" : s === "Viewed" ? "info" : "gold");
const lastDate = (e: Estimate) => e.approvedAt ?? e.viewedAt ?? e.sentAt ?? e.createdAt;

type SP = { s?: string; q?: string };

/** Every estimate in one table — for a lead or on its own (no lead, no project). */
export default async function EstimatesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await currentUser();
  if (user.role === "pm") notFound();
  const showMoney = canSeeMoney(user);
  const [all, leads] = await Promise.all([allEstimates(), getLeads()]);
  const leadName = new Map(leads.map((l) => [l.id, l.name]));
  // Owner / office see everything; a sales rep sees the estimates of their own leads.
  const mine = canSeeAll(user) ? all : all.filter((e) => e.leadId && leadName.has(e.leadId));
  const q = (sp.q ?? "").trim().toLowerCase();
  const rows = mine
    .filter((e) => !sp.s || e.status === sp.s)
    .filter((e) => !q || [e.customer.name, e.customer.phone, e.customer.email, e.customer.address, e.title, `#${e.number}`, String(e.number)].some((x) => x?.toLowerCase().includes(q)));
  const href = (patch: SP) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
    return `/estimates${p.size ? `?${p}` : ""}`;
  };
  const chip = (active: boolean) => clsx("whitespace-nowrap rounded-full border px-3 py-1 text-xs", active ? "border-gold bg-gold-soft font-semibold text-gold-text" : "border-border text-muted");
  const count = (s?: string) => mine.filter((e) => !s || e.status === s).length;
  const approvedTotal = rows.filter((e) => e.status === "Approved").reduce((a, e) => a + e.total, 0);

  return (
    <>
      <PageHeader
        title="Estimates"
        subtitle={showMoney ? `${rows.length} estimates · ${money(rows.reduce((a, e) => a + e.total, 0))} total · ${money(approvedTotal)} approved` : `${rows.length} estimates`}
        actions={canSeeAll(user) && <Button variant="primary" href="/estimates/new"><Plus className="size-4" /> New estimate</Button>}
      />

      <form action="/estimates" className="mb-3 flex max-w-md items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
        {sp.s && <input type="hidden" name="s" value={sp.s} />}
        <Search className="size-4 text-muted" />
        <input name="q" defaultValue={sp.q} placeholder="Customer, phone, address, title or #" className="min-w-0 flex-1 bg-transparent py-0.5 text-sm outline-none" />
      </form>
      <div className="scrollbar-thin mb-4 flex gap-1 overflow-x-auto pb-0.5">
        <Link href={href({ s: undefined })} className={chip(!sp.s)}>All {count()}</Link>
        {STATUSES.map((s) => <Link key={s} href={href({ s })} className={chip(sp.s === s)}>{s} {count(s)}</Link>)}
      </div>

      <Card className="overflow-hidden">
        {!rows.length ? (
          <Empty>{mine.length ? "No estimates match." : canSeeAll(user) ? "No estimates yet — tap New estimate." : "No estimates yet."}</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead className="hidden border-b border-border bg-surface text-left text-xs text-muted md:table-header-group">
              <tr>
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Job</th>
                <th className="px-4 py-2 font-medium">Lead</th>
                {showMoney && <th className="px-4 py-2 text-right font-medium">Total</th>}
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((e) => {
                const link = `/estimates/${e.id}`;
                const lead = e.leadId ? leadName.get(e.leadId) : undefined;
                return (
                  <tr key={e.id} className="relative flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 hover:bg-surface md:table-row md:p-0">
                    <td className="order-1 text-xs text-muted md:px-4 md:py-2.5"><Link href={link} className="after:absolute after:inset-0">#{e.number}</Link></td>
                    <td className="order-2 min-w-0 flex-1 truncate font-medium md:px-4 md:py-2.5">{e.customer.name}</td>
                    <td className="order-5 w-full truncate text-xs text-muted md:w-auto md:px-4 md:py-2.5 md:text-sm md:text-text">{e.title}</td>
                    <td className="order-6 text-xs text-muted md:px-4 md:py-2.5">{lead ?? (e.leadId ? "—" : "No lead")}</td>
                    {showMoney && <td className="order-3 text-right font-semibold md:px-4 md:py-2.5">{money(e.total)}</td>}
                    <td className="order-4 md:px-4 md:py-2.5"><Badge tone={tone(e.status)}>{e.status}</Badge></td>
                    <td className="order-7 ml-auto text-xs text-muted md:ml-0 md:px-4 md:py-2.5">{date(lastDate(e))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
