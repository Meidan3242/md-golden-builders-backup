import clsx from "clsx";
import { Ban, CalendarCheck, Clock, Mail, MessageSquare, RotateCw, Send, Sparkles, ThumbsDown } from "lucide-react";
import { Badge, Card, CardHeader } from "./ui";
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
        <button className="flex items-center justify-center gap-1.5 rounded-xl bg-ok py-2.5 text-sm font-semibold text-white"><CalendarCheck className="size-4" /> Scheduled</button>
        <button className="flex items-center justify-center gap-1.5 rounded-xl border border-gold bg-gold-soft py-2.5 text-sm font-semibold text-gold-text"><RotateCw className="size-4" /> Still trying</button>
        <button className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-medium"><ThumbsDown className="size-4" /> Not a fit</button>
        <button className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-medium"><Ban className="size-4" /> Spam / wrong #</button>
      </div>
      <div className="mt-2 text-[11px] text-muted">Next automatic touch: {attempts < 2 ? "call + text today" : "text tomorrow 9:00 AM"} · plan: Day 0 call+text → Day 1 → Day 2 → Day 4 → Day 7 release</div>
    </Card>
  );
}

const channelTone: Record<string, string> = { Text: "bg-ok-soft text-ok", Thumbtack: "bg-info-soft text-info", Yelp: "bg-bad-soft text-bad", Email: "bg-surface text-muted", Call: "bg-surface text-muted" };

/** One conversation for the lead, whatever platform it came from. */
export function LeadConversation({ lead }: { lead: Lead }) {
  const thread = lead.thread ?? [];
  const platform = lead.source === "Thumbtack" || lead.source === "Yelp" ? lead.source : null;
  return (
    <Card>
      <CardHeader title="Conversation" subtitle={`All messages in one place — ${platform ? `${platform} + ` : ""}text from (858) 332-2168`} action={<Badge tone="info"><MessageSquare className="size-3" /> {thread.length}</Badge>} />
      <div className="space-y-2.5 p-4">
        {thread.map((m, i) => {
          const ours = m.from !== "customer";
          return (
            <div key={i} className={clsx("flex", ours && "justify-end")}>
              <div className={clsx("max-w-[85%] rounded-2xl px-3 py-2 text-sm", ours ? "rounded-br-sm bg-gold-soft" : "rounded-bl-sm bg-surface")}>
                <div className="mb-0.5 flex items-center gap-1.5 text-[10px] text-muted">
                  <span className={clsx("rounded px-1 font-semibold", channelTone[m.channel])}>{m.channel}</span>
                  {m.from === "robot" && <span className="flex items-center gap-0.5"><Sparkles className="size-3" /> InstantResponse</span>}
                  {m.from === "us" && <span>Laline</span>}
                  <span>{dateTime(m.at)}</span>
                </div>
                {m.text}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border p-3">
        <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
          <span className="text-muted">Reply via:</span>
          <span className="rounded-full bg-ok-soft px-2 py-0.5 font-medium text-ok">Text (business line)</span>
          {platform && <span className="rounded-full border border-border px-2 py-0.5">{platform}</span>}
          <span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5"><Mail className="size-3" /> Email</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted">Write a reply… or ask the assistant to draft one</div>
          <button className="gold-gradient rounded-full p-2 text-black" aria-label="Send"><Send className="size-4" /></button>
        </div>
        <div className="mt-1.5 text-[11px] text-muted">Received {date(lead.createdAt)} from {lead.source}</div>
      </div>
    </Card>
  );
}
