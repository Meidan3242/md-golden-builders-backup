import {
  CalendarPlus,
  CheckCircle2,
  Circle,
  Eye,
  FileText,
  Mail,
  MessageSquare,
  Mic,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Play,
  Sparkles,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadConversation, LeadOutcome } from "@/components/lead-parts";
import { LeadStageBadge, SourceBadge } from "@/components/status";
import { Avatar, Badge, Button, Card, CardHeader, KeyValue } from "@/components/ui";
import { canSeeMoney, currentUser, getAppointments, getFollowUps, getLead, userById } from "@/lib/data";
import { now } from "@/lib/clock";
import { date, dateTime, dayKey, duration, money } from "@/lib/format";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();
  const user = await currentUser();
  const showMoney = canSeeMoney(user);
  const followUps = (await getFollowUps()).filter((f) => f.leadId === id);
  const appts = (await getAppointments()).filter((a) => a.leadId === id);
  const owner = userById(lead.assignedTo);

  return (
    <>
      <div className="mb-1 text-xs text-muted"><Link href="/leads" className="hover:underline">Leads</Link> / {lead.id}</div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{lead.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <LeadStageBadge stage={lead.stage} />
            <SourceBadge source={lead.source} />
            <span>· {lead.service}</span>
            <span>· {lead.address}, {lead.city}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href={`tel:${lead.phone}`}><Phone className="size-4" /> Call</Button>
          <Button><MessageSquare className="size-4" /> Text</Button>
          <Button><Mail className="size-4" /> Email</Button>
          <Button><CalendarPlus className="size-4" /> Schedule</Button>
          {lead.projectId ? (
            <Button variant="primary" href={`/projects/${lead.projectId}`}><Trophy className="size-4" /> Open project</Button>
          ) : (
            <Button variant="primary"><Trophy className="size-4" /> Mark won → contract</Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <LeadOutcome lead={lead} />
          <LeadConversation lead={lead} />
          <Card>
            <CardHeader title="Call recordings" subtitle="Pulled automatically from RingCentral and matched by phone number" action={<Badge tone="info"><Mic className="size-3" /> {lead.calls.length}</Badge>} />
            <ul className="divide-y divide-border">
              {lead.calls.map((c) => (
                <li key={c.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button type="button" className="gold-gradient flex size-9 shrink-0 items-center justify-center rounded-full text-black" aria-label="Play recording">
                      <Play className="size-4 fill-current" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {c.direction === "Inbound" ? <PhoneIncoming className="size-3.5 text-ok" /> : <PhoneOutgoing className="size-3.5 text-info" />}
                        {c.direction} call · {userById(c.by)?.name}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1 flex-1 rounded-full bg-surface"><div className="h-1 w-0 rounded-full bg-gold" /></div>
                        <span className="text-[11px] text-muted">0:00 / {duration(c.durationSec)}</span>
                      </div>
                    </div>
                    <span className="hidden text-xs text-muted sm:block">{dateTime(c.at)}</span>
                  </div>
                  {c.summary && (
                    <p className="mt-2 flex gap-1.5 rounded-lg bg-surface px-3 py-2 text-xs text-muted">
                      <Sparkles className="mt-0.5 size-3 shrink-0 text-gold-text" /> {c.summary}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          {lead.stage === "Estimate Sent" || followUps.length > 0 ? (
            <Card>
              <CardHeader title="Follow-up plan" subtitle="Created automatically when the estimate is sent. Goal: book a second meeting." />
              <ol className="divide-y divide-border">
                {followUps.map((f) => {
                  const overdue = !f.done && dayKey(f.due) < dayKey(now());
                  return (
                    <li key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                      {f.done ? <CheckCircle2 className="size-4 text-ok" /> : <Circle className={overdue ? "size-4 text-bad" : "size-4 text-muted"} />}
                      <Badge tone={f.done ? "neutral" : overdue ? "bad" : "gold"}>{f.step}</Badge>
                      <span className={f.done ? "flex-1 text-sm text-muted line-through" : "flex-1 text-sm"}>{f.action}</span>
                      <span className="text-xs text-muted">{date(f.due)} · {userById(f.assignedTo)?.initials}</span>
                    </li>
                  );
                })}
              </ol>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Activity" />
            <ul className="space-y-3 p-4">
              {lead.activity.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <Avatar initials={userById(a.by)?.initials ?? "?"} />
                  <div>
                    <div>{a.text}</div>
                    <div className="text-xs text-muted">{dateTime(a.at)}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-border p-3">
              <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted">Add a note…</div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <KeyValue
              items={[
                ["Phone", <a key="p" href={`tel:${lead.phone}`} className="text-gold-text">{lead.phone}</a>],
                ["Email", lead.email ?? "—"],
                ["Address", `${lead.address}, ${lead.city}`],
                ["Service", lead.service],
                ["Source", lead.source],
                ["Created", dateTime(lead.createdAt)],
                ["Assigned to", owner?.name ?? "—"],
              ]}
            />
            {lead.notes && <p className="mt-3 rounded-lg bg-gold-soft px-3 py-2 text-xs text-gold-text">{lead.notes}</p>}
            {lead.lostReason && <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs">Lost reason: <b>{lead.lostReason}</b></p>}
          </Card>

          <Card>
            <CardHeader title="Estimate (Joist)" />
            <div className="p-4">
              {lead.estimateSentAt ? (
                <>
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <FileText className="size-8 text-bad" />
                    <div className="min-w-0 flex-1">
                      {lead.estimatePdf ? (
                        <a href={`/leads/${lead.id}/estimate`} target="_blank" className="block truncate text-sm font-medium text-gold-text hover:underline">Open estimate PDF</a>
                      ) : (
                        <div className="truncate text-sm font-medium">Joist estimate — {lead.name.split(" ").at(-1)}.pdf</div>
                      )}
                      <div className="text-xs text-muted">Sent {date(lead.estimateSentAt)}</div>
                    </div>
                  </div>
                  {showMoney && lead.estimateAmount && <div className="mt-3 text-2xl font-bold">{money(lead.estimateAmount)}</div>}
                  <Link href="/p/estimate/demo" className="mt-2 inline-block text-xs font-medium text-gold-text hover:underline">Preview what the customer sees →</Link>
                  {lead.estimateViewedAt ? (
                    <div className="mt-1 space-y-0.5 text-xs">
                      <div className="inline-flex items-center gap-1 text-ok"><Eye className="size-3.5" /> Opened 3 times · last {dateTime(lead.estimateViewedAt)}</div>
                      <div className="text-muted">Read for 4 min · looked at the payment schedule twice · added “French drain”</div>
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-muted">Not opened yet</div>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">Drop the Joist PDF here, or forward the Joist email</div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Appointments" />
            <ul className="divide-y divide-border">
              {appts.map((a) => (
                <li key={a.id} className="px-4 py-2.5 text-sm">
                  <div className="font-medium">{a.type}</div>
                  <div className="text-xs text-muted">{dateTime(a.start)} · {a.confirmation}</div>
                </li>
              ))}
              {!appts.length && <li className="px-4 py-4 text-center text-xs text-muted">No appointments</li>}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
