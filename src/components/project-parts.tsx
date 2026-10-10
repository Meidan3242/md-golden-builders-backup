import { Camera, Check, FileText, Paperclip, Play, Receipt, X } from "lucide-react";
import { PayStatusBadge, WaiverBadge } from "./status";
import { Badge, Card, CardHeader, Empty } from "./ui";
import { subById } from "@/lib/data";
import { date, money } from "@/lib/format";
import type { Expense, MediaItem, PaymentMilestone, SubAssignment } from "@/lib/types";

export function MilestoneTable({ milestones, title = "Customer payment schedule" }: { milestones: PaymentMilestone[]; title?: string }) {
  const total = milestones.reduce((a, m) => a + m.amount, 0);
  const paid = milestones.filter((m) => m.status === "Paid").reduce((a, m) => a + m.amount, 0);
  return (
    <Card className="overflow-x-auto">
      <CardHeader title={title} subtitle={`${money(paid)} of ${money(total)} collected`} action={<button className="text-xs font-medium text-gold-text">+ Milestone</button>} />
      <table className="w-full min-w-[640px] text-sm">
        <thead className="text-left text-xs text-muted">
          <tr className="border-b border-border">
            <th className="px-4 py-2 font-medium">#</th>
            <th className="px-4 py-2 font-medium">Milestone</th>
            <th className="px-4 py-2 text-right font-medium">Amount</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Paid / due</th>
            <th className="px-4 py-2 font-medium">Method</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {milestones.map((m, i) => (
            <tr key={m.id}>
              <td className="px-4 py-2.5 text-muted">{i + 1}</td>
              <td className="px-4 py-2.5 font-medium">{m.name}</td>
              <td className="px-4 py-2.5 text-right font-semibold">{money(m.amount)}</td>
              <td className="px-4 py-2.5"><PayStatusBadge status={m.status} /></td>
              <td className="px-4 py-2.5 text-muted">{m.paidAt ? date(m.paidAt) : m.dueDate ? `Due ${date(m.dueDate)}` : "—"}</td>
              <td className="px-4 py-2.5 text-muted">{m.method ?? "—"}</td>
              <td className="px-4 py-2.5 text-right">
                {m.status === "Upcoming" && <button className="text-xs font-medium text-gold-text">Send invoice</button>}
                {m.status === "Invoiced" && <button className="text-xs font-medium text-gold-text">Record payment</button>}
                {m.status === "Paid" && <button className="text-xs text-muted">Receipt</button>}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-surface/60 text-sm">
            <td />
            <td className="px-4 py-2 font-semibold">Total</td>
            <td className="px-4 py-2 text-right font-bold">{money(total)}</td>
            <td colSpan={4} />
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}

export function SubAssignmentCard({ a }: { a: SubAssignment }) {
  const sub = subById(a.subId);
  const paid = a.payments.filter((p) => p.status === "Paid").reduce((x, p) => x + p.amount, 0);
  return (
    <Card className="overflow-x-auto">
      <CardHeader
        title={<span>{sub?.company} <span className="font-normal text-muted">· {sub?.trade}</span></span>}
        subtitle={a.scope}
        action={
          <div className="flex flex-col items-end gap-1">
            <span className="text-sm font-bold">{money(a.amount)}</span>
            <Badge tone={a.agreement === "Signed" ? "ok" : a.agreement === "Sent" ? "warn" : "bad"}>Agreement {a.agreement.toLowerCase()}</Badge>
          </div>
        }
      />
      <table className="w-full min-w-[680px] text-sm">
        <thead className="text-left text-xs text-muted">
          <tr className="border-b border-border">
            <th className="px-4 py-2 font-medium">Payment</th>
            <th className="px-4 py-2 text-right font-medium">Amount</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Method / ref</th>
            <th className="px-4 py-2 font-medium">Proof</th>
            <th className="px-4 py-2 font-medium">Lien waiver</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {a.payments.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-2.5 font-medium">{p.name}</td>
              <td className="px-4 py-2.5 text-right font-semibold">{money(p.amount)}</td>
              <td className="px-4 py-2.5"><PayStatusBadge status={p.status} />{p.paidAt && <span className="ml-1.5 text-xs text-muted">{date(p.paidAt)}</span>}</td>
              <td className="px-4 py-2.5 text-xs text-muted">{p.method ? `${p.method}${p.reference ? ` · ${p.reference}` : ""}` : "—"}</td>
              <td className="px-4 py-2.5">{p.status === "Paid" ? (p.proof ? <Paperclip className="size-4 text-ok" /> : <Badge tone="bad">Missing</Badge>) : <span className="text-xs text-muted">—</span>}</td>
              <td className="px-4 py-2.5"><WaiverBadge w={p.lienWaiver} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted">
        <span>Paid {money(paid)} of {money(a.amount)} · prefers {sub?.preferredMethod}</span>
        <button className="font-medium text-gold-text">Record payment</button>
      </div>
    </Card>
  );
}

export function ExpensesTable({ expenses }: { expenses: Expense[] }) {
  const total = expenses.reduce((a, e) => a + e.amount, 0);
  return (
    <Card className="overflow-x-auto">
      <CardHeader title="Expenses & receipts" subtitle={`${money(total)} total`} action={<button className="inline-flex items-center gap-1 text-xs font-medium text-gold-text"><Camera className="size-3.5" /> Snap receipt</button>} />
      {expenses.length ? (
        <table className="w-full min-w-[560px] text-sm">
          <tbody className="divide-y divide-border">
            {expenses.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2.5 text-muted">{date(e.date)}</td>
                <td className="px-4 py-2.5 font-medium">{e.vendor}</td>
                <td className="px-4 py-2.5"><Badge>{e.category}</Badge></td>
                <td className="px-4 py-2.5">{e.receipt ? <span className="inline-flex items-center gap-1 text-xs text-ok"><Receipt className="size-3.5" /> Receipt</span> : <Badge tone="bad">No receipt</Badge>}</td>
                <td className="px-4 py-2.5 text-right font-semibold">{money(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Empty>No expenses yet</Empty>
      )}
    </Card>
  );
}

export function MediaGrid({ media }: { media: MediaItem[] }) {
  const phases: MediaItem["phase"][] = ["Before", "During", "After"];
  return (
    <div className="space-y-5">
      {phases.map((ph) => {
        const items = media.filter((m) => m.phase === ph);
        return (
          <div key={ph}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{ph} <span className="font-normal text-muted">{items.length}</span></h3>
            </div>
            {items.length ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {items.map((m) => (
                  <div
                    key={m.id}
                    className="relative aspect-square overflow-hidden rounded-lg"
                    style={{ background: `linear-gradient(135deg, hsl(${m.hue} 25% 62%), hsl(${(m.hue + 40) % 360} 30% 38%))` }}
                  >
                    {m.kind === "video" && <Play className="absolute inset-0 m-auto size-8 fill-white text-white drop-shadow" />}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 text-[10px] text-white">
                      {m.caption}
                      <div className="opacity-70">{date(m.at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted">No {ph.toLowerCase()} media yet</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Check2({ ok }: { ok: boolean }) {
  return ok ? <Check className="size-4 text-ok" /> : <X className="size-4 text-bad" />;
}

export function DocIcon() {
  return <FileText className="size-5 text-bad" />;
}
