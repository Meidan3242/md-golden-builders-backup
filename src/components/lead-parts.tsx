import clsx from "clsx";
import { Ban, CalendarCheck, Clock, MessageSquare, RotateCw, Sparkles, ThumbsDown } from "lucide-react";
import { ConversationReply } from "./conversation-reply";
import { Badge, Card, CardHeader, Soon } from "./ui";
import { now } from "@/lib/clock";
import { date, dateTime, daysFrom } from "@/lib/format";
import { MAX_ATTEMPTS, RELEASE_AFTER_DAYS, type Lead } from "@/lib/types";

/** "What happened with this lead?" — one tap after every contact attempt. */
export function LeadOutcome({ lead }: { lead: Lead }) {
  const open = lead.stage === "New" || lead.stage === "Trying to Reach";
  const attempts = lead.attempts ?? 0;
  const age = -daysFrom(lead.createdAt, now());
  const releaseIn = Math.max(0, RELEASE_AFTER_DAYS - age);

  if (lead.stage === "No Response") {
    return (
      <Card className="p-4">
        <div className="text-sm font-semibold">Released — no answer for {RELEASE_AFTER_DAYS} days ({MAX_ATTEMPTS} attempts)</div>
        <div className="text-xs text-muted">Removed from all working lists so nobody keeps chasing it. Still counted as a received {lead.source} lead in reports. If the customer replies, it comes back automatically.</div>
      </Card>
    );
  }
  if (!open) return null;

  return (
    <Card className="border-gold/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">What happened with this lead?</div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Clock className="size-3.5" /> Attempt {attempts} of {MAX_ATTEMPTS} · auto-release in {releaseIn} day{releaseIn === 1 ? "" : "s"}
        </div>
      </div>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: MAX_ATTEMPTS }, (_, i) => (
          <span key={i} className={clsx("h-1.5 flex-1 rounded-full", i < attempts ? "gold-gradient" : "bg-surface")} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Soon className="flex items-center justify-center gap-1.5 rounded-xl bg-ok py-2.5 text-sm font-semibold text-white"><CalendarCheck className="size-4" /> Scheduled</Soon>
        <Soon className="flex items-center justify-center gap-1.5 rounded-xl border border-gold bg-gold-soft py-2.5 text-sm font-semibold text-gold-text"><RotateCw className="size-4" /> Still trying</Soon>
        <Soon className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-medium"><ThumbsDown className="size-4" /> Not a fit</Soon>
        <Soon className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-medium"><Ban className="size-4" /> Spam / wrong #</Soon>
      </div>
      <div className="mt-2 text-[11px] text-muted">Next automatic touch: {attempts < 2 ? "call + text today" : "text tomorrow 9:00 AM"} · plan: Day 0 call+text → Day 1 → Day 2 → Day 4 → Day 7 release</div>
    </Card>
  );
}

const channelTone: Record<string, string> = { Text: "bg-ok-soft text-ok", Thumbtack: "bg-info-soft text-info", Yelp: "bg-bad-soft text-bad", Email: "bg-surface text-muted", Call: "bg-surface text-muted" };

/** One conversation for the lead, whatever platform it came from. */
export function LeadConversation({ lead, emailOn }: { lead: Lead; emailOn: boolean }) {
  const thread = lead.thread ?? [];
  const platform = lead.source === "Thumbtack" || lead.source === "Yelp" ? lead.source : null;
  return (
    <Card className="scroll-mt-20" id="conversation">
      <CardHeader title="Conversation" subtitle={`Texts, emails and calls with the customer${platform ? ` (+ ${platform})` : ""}, in one place`} action={<Badge tone="info"><MessageSquare className="size-3" /> {thread.length}</Badge>} />
      <div className="space-y-2.5 p-4">
        {!thread.length && <p className="text-center text-sm text-muted">Nothing yet — send a text or email below, or write down their reply.</p>}
        {thread.map((m, i) => {
          const ours = m.from !== "customer";
          return (
            <div key={i} className={clsx("flex", ours && "justify-end")}>
              <div className={clsx("max-w-[85%] rounded-2xl px-3 py-2 text-sm", ours ? "rounded-br-sm bg-gold-soft" : "rounded-bl-sm bg-surface")}>
                <div className="mb-0.5 flex items-center gap-1.5 text-[10px] text-muted">
                  <span className={clsx("rounded px-1 font-semibold", channelTone[m.channel])}>{m.channel}</span>
                  {m.from === "robot" && <span className="flex items-center gap-0.5"><Sparkles className="size-3" /> InstantResponse</span>}
                  {m.from === "customer" && <span>Customer</span>}
                  <span>{dateTime(m.at)}</span>
                </div>
                {m.text}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border p-3">
        <ConversationReply leadId={lead.id} phone={lead.phone} email={lead.email} emailOn={emailOn} />
        <div className="mt-1.5 text-[11px] text-muted">Received {date(lead.createdAt)} from {lead.source}</div>
      </div>
    </Card>
  );
}
