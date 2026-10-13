import { List, Trophy } from "lucide-react";
import Link from "next/link";
import { sourceColor } from "./status";
import { BackLink, Card, CardHeader } from "./ui";
import { CHANNELS, MONTHLY_HISTORY, type Channel } from "@/lib/demo-data";
import { compactMoney, money } from "@/lib/format";

const monthName = (m: string) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

/** "All leads": the year at a glance — by month and by channel. */
export function LeadsReport({ showMoney }: { showMoney: boolean }) {
  const months = MONTHLY_HISTORY.map((h) => {
    const t = { leads: 0, estimates: 0, sold: 0, soldValue: 0 };
    for (const c of CHANNELS) for (const k of Object.keys(t) as (keyof typeof t)[]) t[k] += h.channels[c][k];
    return { month: h.month, ...t };
  });
  const year = months.reduce((a, m) => ({ leads: a.leads + m.leads, estimates: a.estimates + m.estimates, sold: a.sold + m.sold, soldValue: a.soldValue + m.soldValue }), { leads: 0, estimates: 0, sold: 0, soldValue: 0 });
  const channels = CHANNELS.map((c: Channel) => {
    const t = MONTHLY_HISTORY.reduce((a, h) => ({ leads: a.leads + h.channels[c].leads, estimates: a.estimates + h.channels[c].estimates, sold: a.sold + h.channels[c].sold, soldValue: a.soldValue + h.channels[c].soldValue }), { leads: 0, estimates: 0, sold: 0, soldValue: 0 });
    return { c, ...t };
  });
  const best = [...channels].sort((a, b) => b.soldValue - a.soldValue)[0];
  const maxLeads = Math.max(...months.map((m) => m.leads));
  const maxSold = Math.max(...channels.map((c) => c.soldValue));

  return (
    <>
      <BackLink href="/leads" label="Leads" />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All leads — 2026</h1>
          <p className="text-sm text-muted">January to today</p>
        </div>
        <Link href="/leads?box=list" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-surface"><List className="size-4" /> See every lead</Link>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Leads this year", year.leads.toLocaleString()],
          ["Estimates sent", `${year.estimates}`, `${pct(year.estimates, year.leads)} of leads`],
          ["Sold", `${year.sold} jobs`, `${pct(year.sold, year.estimates)} of estimates`],
          ...(showMoney ? [["Sold $", compactMoney(year.soldValue), `avg ${compactMoney(year.soldValue / year.sold)} a job`]] : []),
        ].map(([k, v, h]) => (
          <Card key={k} className="p-4">
            <div className="text-sm text-muted">{k}</div>
            <div className="text-2xl font-bold">{v}</div>
            {h && <div className="text-xs text-muted">{h}</div>}
          </Card>
        ))}
      </div>

      <Card className="mb-4">
        <CardHeader title="Leads per month" subtitle="This month counts the days so far" />
        <div className="flex h-48 items-end gap-1.5 px-4 pb-2 pt-6 sm:gap-3">
          {months.map((m, i) => (
            <div key={m.month} className="group relative flex h-full flex-1 flex-col justify-end" title={`${monthName(m.month)}: ${m.leads} leads · ${m.estimates} estimates · ${m.sold} sold`}>
              <span className="mb-1 text-center text-[11px] font-semibold text-text">{m.leads}</span>
              <div className={i === months.length - 1 ? "rounded-t bg-gold/50" : "rounded-t bg-gold"} style={{ height: `${(m.leads / maxLeads) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 border-t border-border px-4 py-1.5 sm:gap-3">
          {months.map((m) => <span key={m.month} className="flex-1 text-center text-[11px] text-muted">{monthName(m.month)}</span>)}
        </div>
      </Card>

      <Card className="mb-4 overflow-x-auto">
        <CardHeader title="By channel" subtitle="Where leads come from — and where we actually sell" action={<span className="inline-flex items-center gap-1 text-xs font-semibold text-gold-text"><Trophy className="size-3.5" /> Most sold: {best.c}</span>} />
        <table className="w-full min-w-[620px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-border">
              <th className="px-4 py-2 font-medium">Channel</th>
              <th className="px-4 py-2 text-right font-medium">Leads</th>
              <th className="px-4 py-2 text-right font-medium">Estimates</th>
              <th className="px-4 py-2 text-right font-medium">Sold</th>
              <th className="px-4 py-2 text-right font-medium">Lead → sale</th>
              {showMoney && <th className="px-4 py-2 font-medium">Sold $</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {channels.map((c) => (
              <tr key={c.c}>
                <td className="px-4 py-2.5 font-medium"><span className="mr-2 inline-block size-2.5 rounded-full" style={{ background: c.c === "Other" ? "#8a8a8a" : sourceColor(c.c) }} />{c.c}</td>
                <td className="px-4 py-2.5 text-right">{c.leads}</td>
                <td className="px-4 py-2.5 text-right">{c.estimates}</td>
                <td className="px-4 py-2.5 text-right font-semibold">{c.sold}</td>
                <td className="px-4 py-2.5 text-right">{pct(c.sold, c.leads)}</td>
                {showMoney && (
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-28 rounded-full bg-surface"><div className="h-2 rounded-full bg-gold" style={{ width: `${(c.soldValue / maxSold) * 100}%` }} /></div>
                      <span className="font-semibold">{money(c.soldValue)}</span>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-x-auto">
        <CardHeader title="Month by month" />
        <table className="w-full min-w-[520px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-border">
              <th className="px-4 py-2 font-medium">Month</th>
              <th className="px-4 py-2 text-right font-medium">Leads</th>
              <th className="px-4 py-2 text-right font-medium">Estimates</th>
              <th className="px-4 py-2 text-right font-medium">Sold</th>
              {showMoney && <th className="px-4 py-2 text-right font-medium">Sold $</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[...months].reverse().map((m) => (
              <tr key={m.month}>
                <td className="px-4 py-2 font-medium">{monthName(m.month)}</td>
                <td className="px-4 py-2 text-right">{m.leads}</td>
                <td className="px-4 py-2 text-right">{m.estimates}</td>
                <td className="px-4 py-2 text-right">{m.sold}</td>
                {showMoney && <td className="px-4 py-2 text-right font-semibold">{money(m.soldValue)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
