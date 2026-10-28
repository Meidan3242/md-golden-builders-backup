import { Phone } from "lucide-react";
import { Badge, Button, Card, Empty, PageHeader } from "@/components/ui";
import { canSeeMoney, currentUser, getProjects, getSubcontractors } from "@/lib/data";
import { now } from "@/lib/clock";
import { date, daysFrom, money } from "@/lib/format";

export default async function SubsPage() {
  const user = await currentUser();
  const showMoney = canSeeMoney(user);
  const [subs, projects] = await Promise.all([getSubcontractors(), getProjects()]);
  const assignments = projects.flatMap((p) => [...p.subs, ...p.changeOrders.flatMap((c) => c.subs)].map((a) => ({ p, a })));

  return (
    <>
      <PageHeader title="Subcontractors" subtitle="License, insurance, W-9 and payment history for every sub" actions={<Button variant="primary">+ Add subcontractor</Button>} />
      {!subs.length && <Card><Empty>No subcontractors yet. They&apos;ll show here with their license, insurance and payments once they&apos;re added.</Empty></Card>}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {subs.map((s) => {
          const mine = assignments.filter((x) => x.a.subId === s.id);
          const paid = mine.flatMap((x) => x.a.payments).filter((p) => p.status === "Paid").reduce((a, p) => a + p.amount, 0);
          const insDays = s.insuranceExpires ? daysFrom(s.insuranceExpires, now()) : undefined;
          return (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{s.company}</div>
                  <div className="text-xs text-muted">{s.name} · {s.trade}</div>
                </div>
                <a href={`tel:${s.phone}`} className="rounded-lg border border-border p-1.5 hover:bg-surface" aria-label="Call"><Phone className="size-4" /></a>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.licenseNo ? <Badge tone="ok">Lic. {s.licenseNo}</Badge> : <Badge tone="bad">No license on file</Badge>}
                {insDays === undefined ? (
                  <Badge tone="bad">No insurance</Badge>
                ) : insDays < 0 ? (
                  <Badge tone="bad">Insurance expired {date(s.insuranceExpires)}</Badge>
                ) : insDays < 30 ? (
                  <Badge tone="warn">Insurance expires in {insDays}d</Badge>
                ) : (
                  <Badge tone="ok">Insured to {date(s.insuranceExpires)}</Badge>
                )}
                <Badge tone={s.w9 ? "ok" : "bad"}>{s.w9 ? "W-9 ✓" : "W-9 missing"}</Badge>
              </div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 text-xs text-muted">
                <span>{mine.length} active job{mine.length === 1 ? "" : "s"} · pays via {s.preferredMethod}</span>
                {showMoney && <span className="font-semibold text-text">Paid {money(paid)}</span>}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
