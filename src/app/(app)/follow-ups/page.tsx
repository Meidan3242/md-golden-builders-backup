import { CheckCircle2, MessageSquare, Phone } from "lucide-react";
import Link from "next/link";
import { finishFollowUp } from "@/app/actions/leads";
import { dbReady } from "@/lib/db";
import { Badge, Card, CardHeader, PageHeader, Soon } from "@/components/ui";
import { canSeeMoney, currentUser, getFollowUps, getLeads, userById } from "@/lib/data";
import { now } from "@/lib/clock";
import { date, dayKey, money } from "@/lib/format";
import type { FollowUp, Lead } from "@/lib/types";

export default async function FollowUpsPage() {
  const user = await currentUser();
  const showMoney = canSeeMoney(user);
  const [all, leads] = await Promise.all([getFollowUps(), getLeads()]);
  const open = all.filter((f) => !f.done);
  const today0 = dayKey(now());
  const overdue = open.filter((f) => dayKey(f.due) < today0);
  const today = open.filter((f) => dayKey(f.due) === today0);
  const later = open.filter((f) => dayKey(f.due) > today0).slice(0, 12);
  const lead = (id: string) => leads.find((l) => l.id === id)!;
  const live = await dbReady();

  return (
    <>
      <PageHeader
        title="Follow-ups"
        subtitle="After every estimate: Day 1 → Day 3 → Day 7 → Day 14 → Day 30. Every message is sent by a person — Day 14 comes from Meidan himself."
      />
      <div className="space-y-4">
        <Group title="Overdue" tone="bad" items={overdue} lead={lead} showMoney={showMoney} live={live} />
        <Group title="Due today" tone="gold" items={today} lead={lead} showMoney={showMoney} live={live} />
        <Group title="Coming up" tone="neutral" items={later} lead={lead} showMoney={showMoney} live={live} />
      </div>
    </>
  );
}

function Group({ title, tone, items, lead, showMoney, live }: { title: string; tone: "bad" | "gold" | "neutral"; items: FollowUp[]; lead: (id: string) => Lead; showMoney: boolean; live: boolean }) {
  return (
    <Card>
      <CardHeader title={<span className="flex items-center gap-2">{title} <Badge tone={tone}>{items.length}</Badge></span>} />
      <ul className="divide-y divide-border">
        {items.map((f) => {
          const l = lead(f.leadId);
          return (
            <li key={f.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Badge tone={tone}>{f.step}</Badge>
              <div className="min-w-0 flex-1">
                <Link href={`/leads/${l.id}`} className="text-sm font-semibold hover:underline">{l.name}</Link>
                <span className="ml-2 text-xs text-muted">{l.service}{showMoney && l.estimateAmount ? ` · ${money(l.estimateAmount)}` : ""}{l.estimateViewedAt ? " · 👀 opened estimate" : ""}</span>
                <div className="text-xs text-muted">{f.action}</div>
              </div>
              <span className="text-xs text-muted">{date(f.due)} · {userById(f.assignedTo)?.name}</span>
              <div className="flex gap-1">
                <a href={`tel:${l.phone}`} className="rounded-lg border border-border p-1.5 hover:bg-surface" aria-label="Call"><Phone className="size-4" /></a>
                {f.step === "Day 14" ? (
                  <Link href={`/follow-ups/send/${l.id}`} className="gold-gradient inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-black"><MessageSquare className="size-4" /> Your message</Link>
                ) : (
                  <Soon className="rounded-lg border border-border p-1.5 hover:bg-surface" aria-label="Text"><MessageSquare className="size-4" /></Soon>
                )}
                {live ? (
                  <form action={finishFollowUp.bind(null, f.id)}><button type="submit" className="rounded-lg border border-border p-1.5 text-ok hover:bg-surface" aria-label="Done"><CheckCircle2 className="size-4" /></button></form>
                ) : (
                  <Soon className="rounded-lg border border-border p-1.5 text-ok hover:bg-surface"><CheckCircle2 className="size-4" /></Soon>
                )}
              </div>
            </li>
          );
        })}
        {!items.length && <li className="px-4 py-5 text-center text-sm text-muted">Nothing here</li>}
      </ul>
    </Card>
  );
}
