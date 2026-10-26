import { redirect } from "next/navigation";
import { sourceColor } from "@/components/status";
import { Badge, Card, CardHeader, Empty, PageHeader, Stat } from "@/components/ui";
import { dbConfigured } from "@/lib/clock";
import { canSeeMoney, currentUser, getMarketingSpend, getProjects, projectFinancials } from "@/lib/data";
import { compactMoney, money, pct } from "@/lib/format";

// Illustrative 3-month funnel based on the owner's numbers (~90 leads/month,
// ~30% each Google / Yelp / Thumbtack). Replaced by real data after the import.
const FUNNEL = [
  { source: "Google", leads: 81, visits: 52, estimates: 44, won: 9, revenue: 612000 },
  { source: "Yelp", leads: 80, visits: 41, estimates: 33, won: 6, revenue: 298000 },
  { source: "Thumbtack", leads: 82, visits: 30, estimates: 22, won: 3, revenue: 71000 },
  { source: "Referral", leads: 12, visits: 11, estimates: 10, won: 5, revenue: 284000 },
  { source: "Instagram", leads: 15, visits: 6, estimates: 5, won: 1, revenue: 38000 },
];

export default async function ReportsPage() {
  const user = await currentUser();
  if (!canSeeMoney(user)) redirect("/");
  const [spend, projects] = await Promise.all([getMarketingSpend(), getProjects()]);
  const spendBy = (s: string) => spend.filter((x) => x.source === s).reduce((a, x) => a + x.amount, 0);
  const totalSpend = spend.reduce((a, x) => a + x.amount, 0);
  const rows = FUNNEL.map((r) => {
    const cost = spendBy(r.source);
    return { ...r, cost, cpl: cost ? cost / r.leads : 0, cps: cost && r.won ? cost / r.won : 0, roi: cost ? r.revenue / cost : Infinity, close: r.won / r.leads };
  });
  const totLeads = rows.reduce((a, r) => a + r.leads, 0);
  const totWon = rows.reduce((a, r) => a + r.won, 0);
  const totRev = rows.reduce((a, r) => a + r.revenue, 0);
  const fins = projects.map((p) => ({ p, f: projectFinancials(p) }));
  const sample = !dbConfigured(); // the funnel above is illustrative: never shown next to real data

  return (
    <>
      <PageHeader title="Reports" subtitle={<>Marketing ROI, conversion and project profit{sample && <> · last 3 months <Badge tone="warn" className="ml-1">Illustrative sample</Badge></>}</>} />
      {sample ? (
        <>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Marketing spend" value={money(totalSpend)} hint="Google, Thumbtack, Yelp + marketing manager" />
        <Stat label="Cost per lead" value={money(totalSpend / totLeads)} hint={`${totLeads} leads`} />
        <Stat label="Cost per signed job" value={money(totalSpend / totWon)} hint={`${totWon} jobs · ${pct(totWon / totLeads)} close rate`} tone="gold" />
        <Stat label="Revenue from marketing" value={compactMoney(totRev)} hint={`${(totRev / totalSpend).toFixed(0)}× return on spend`} tone="ok" />
      </div>

      <Card className="mb-4 overflow-x-auto">
        <CardHeader title="Which platform actually makes money?" subtitle="Cost per signed job matters more than cost per lead" />
        <table className="w-full min-w-[820px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-border">
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 text-right font-medium">Spend</th>
              <th className="px-4 py-2 text-right font-medium">Leads</th>
              <th className="px-4 py-2 text-right font-medium">Site visits</th>
              <th className="px-4 py-2 text-right font-medium">Won</th>
              <th className="px-4 py-2 text-right font-medium">Close rate</th>
              <th className="px-4 py-2 text-right font-medium">Cost / lead</th>
              <th className="px-4 py-2 text-right font-medium">Cost / job</th>
              <th className="px-4 py-2 text-right font-medium">Revenue</th>
              <th className="px-4 py-2 text-right font-medium">Return</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.source}>
                <td className="px-4 py-2.5 font-medium"><span className="mr-2 inline-block size-2 rounded-full" style={{ background: sourceColor(r.source) }} />{r.source}</td>
                <td className="px-4 py-2.5 text-right">{r.cost ? money(r.cost) : "—"}</td>
                <td className="px-4 py-2.5 text-right">{r.leads}</td>
                <td className="px-4 py-2.5 text-right">{r.visits}</td>
                <td className="px-4 py-2.5 text-right font-semibold">{r.won}</td>
                <td className="px-4 py-2.5 text-right">{pct(r.close)}</td>
                <td className="px-4 py-2.5 text-right">{r.cost ? money(r.cpl) : "—"}</td>
                <td className="px-4 py-2.5 text-right font-semibold">{r.cps ? money(r.cps) : "—"}</td>
                <td className="px-4 py-2.5 text-right">{compactMoney(r.revenue)}</td>
                <td className="px-4 py-2.5 text-right">{Number.isFinite(r.roi) ? <Badge tone={r.roi > 20 ? "ok" : r.roi > 8 ? "gold" : "bad"}>{r.roi.toFixed(0)}×</Badge> : <Badge tone="ok">Free</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

        </>
      ) : (
        <Card className="mb-4">
          <CardHeader title="Marketing ROI" subtitle="Spend, leads and signed jobs per platform" />
          <Empty>No marketing spend has been entered yet, so there are no platform numbers to show. Project profit below is from your real projects.</Empty>
        </Card>
      )}

      <Card className="overflow-x-auto">
        <CardHeader title="Project profit" subtitle="Contract + change orders − subcontractors − expenses" />
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-border">
              <th className="px-4 py-2 font-medium">Project</th>
              <th className="px-4 py-2 text-right font-medium">Revenue</th>
              <th className="px-4 py-2 text-right font-medium">Subs</th>
              <th className="px-4 py-2 text-right font-medium">Expenses</th>
              <th className="px-4 py-2 text-right font-medium">Profit</th>
              <th className="px-4 py-2 text-right font-medium">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {fins.map(({ p, f }) => (
              <tr key={p.id}>
                <td className="px-4 py-2.5"><span className="font-medium">{p.customer}</span> <span className="text-muted">· {p.type}</span></td>
                <td className="px-4 py-2.5 text-right">{money(f.revenue)}</td>
                <td className="px-4 py-2.5 text-right">{money(f.subCommitted)}</td>
                <td className="px-4 py-2.5 text-right">{money(f.expenses)}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-gold-text">{money(f.profit)}</td>
                <td className="px-4 py-2.5 text-right">{pct(f.margin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
