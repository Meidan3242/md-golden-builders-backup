import clsx from "clsx";
import { Camera, CheckCircle2, FileText, Image as ImageIcon, Mic, Paperclip, Send, Sparkles, Video } from "lucide-react";
import Link from "next/link";
import { Avatar, Badge, Card, Soon } from "./ui";
import { userById } from "@/lib/data";
import { dateTime } from "@/lib/format";
import type { ChatMessage } from "@/lib/types";

const QUICK = [
  "Send payment summary to customer",
  "Request next payment",
  "Weekly update to customer",
  "What do we owe the subs?",
  "What's next on this job?",
  "Create change order",
];

/**
 * The project assistant: one wide chat where the team talks, drops photos/videos/
 * screenshots/receipts, and asks for things. The assistant files what it can and
 * prepares anything that goes to a customer or moves money for a one-tap approval.
 */
export function ProjectChat({ messages, me, limit, moreHref }: { messages: ChatMessage[]; me: string; limit?: number; moreHref?: string }) {
  const feed = [...messages].reverse().slice(0, limit ?? messages.length); // newest first, right under the composer

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-gold-soft/40 p-3 sm:p-4">
        <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Sparkles className="size-4 text-gold-text" /> Project assistant</div>
        <div className="rounded-2xl border border-gold/50 bg-card p-2 shadow-sm">
          <div className="min-h-12 px-2 py-1.5 text-sm text-muted">Talk, drop a video or a payment screenshot, or ask: “send Rachel what she paid so far”…</div>
          <div className="flex items-center gap-1">
            <Soon className="rounded-lg p-2 text-muted hover:bg-surface" aria-label="Camera"><Camera className="size-5" /></Soon>
            <Soon className="rounded-lg p-2 text-muted hover:bg-surface" aria-label="Attach"><Paperclip className="size-5" /></Soon>
            <Soon className="rounded-lg p-2 text-muted hover:bg-surface" aria-label="Voice"><Mic className="size-5" /></Soon>
            <Soon className="gold-gradient ml-auto rounded-xl p-2.5 text-black" aria-label="Send"><Send className="size-4" /></Soon>
          </div>
        </div>
        <div className="scrollbar-thin mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {QUICK.map((q) => (
            <span key={q} className="whitespace-nowrap rounded-full border border-border bg-card px-2.5 py-1 text-xs hover:border-gold">{q}</span>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-3 sm:p-4">
        {feed.map((m) => {
          const bot = m.by === "assistant";
          const mine = m.by === me;
          const u = userById(m.by);
          return (
            <div key={m.id} className={clsx("flex gap-2", mine && "flex-row-reverse")}>
              {bot ? (
                <span className="gold-gradient mt-1 flex size-6 shrink-0 items-center justify-center rounded-full text-black"><Sparkles className="size-3.5" /></span>
              ) : (
                <Avatar initials={u?.initials ?? "?"} className="mt-1" />
              )}
              <div className={clsx("max-w-[88%] space-y-1.5 sm:max-w-[75%]", mine && "text-right")}>
                <div className="text-[11px] text-muted">{bot ? "Assistant" : u?.name} · {dateTime(m.at)}</div>

                {(m.text || m.attachment) && (
                  <div className={clsx("inline-block rounded-2xl px-3 py-2 text-left text-sm", mine ? "bg-gold-soft" : "bg-surface")}>
                    {m.attachment && (
                      <div className="mb-1 flex items-center gap-2 rounded-lg bg-card px-2 py-1.5 text-xs">
                        {m.attachment.kind === "pdf" ? <FileText className="size-4 text-bad" /> : m.attachment.kind === "video" ? <Video className="size-4 text-info" /> : <ImageIcon className="size-4 text-info" />}
                        {m.attachment.name}
                      </div>
                    )}
                    {m.text && <span className={m.text.startsWith("/") ? "font-mono text-[13px]" : undefined}>{m.text}</span>}
                  </div>
                )}

                {m.capture && (
                  <div className="rounded-xl border border-gold/50 bg-card p-3 text-left shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-gold-text"><Sparkles className="size-3.5" /> {m.capture.kind}</span>
                      <Badge tone={m.capture.status === "Saved" ? "ok" : "warn"}>{m.capture.status === "Saved" ? "✓ Saved" : "Confirm?"}</Badge>
                    </div>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
                      {m.capture.fields.map(([k, v]) => (
                        <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
                      ))}
                    </dl>
                    <div className="mt-2 flex items-start gap-1.5 border-t border-border pt-2 text-[11px] text-muted"><CheckCircle2 className="mt-px size-3 shrink-0 text-ok" /> {m.capture.destination}</div>
                    {m.capture.status !== "Saved" && (
                      <div className="mt-2 flex gap-2">
                        <Soon className="gold-gradient rounded-lg px-3 py-1 text-xs font-semibold text-black">Confirm</Soon>
                        <Soon className="rounded-lg border border-border px-3 py-1 text-xs">Edit</Soon>
                      </div>
                    )}
                  </div>
                )}

                {m.reply && (
                  <div className="rounded-xl border border-gold/50 bg-card p-3 text-left shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{m.reply.title}</span>
                      {m.reply.channel && <Badge tone="info">{m.reply.channel}</Badge>}
                    </div>
                    <div className={clsx("mt-2 space-y-1 text-sm", m.reply.channel && "rounded-lg bg-surface p-2.5")}>
                      {m.reply.body.map((line) => <p key={line}>{line}</p>)}
                    </div>
                    {m.reply.done && <div className="mt-2 text-xs font-medium text-ok">{m.reply.done}</div>}
                    {m.reply.actions && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {m.reply.actions.map((a, i) => (
                          <Soon key={a} className={i === 0 ? "gold-gradient rounded-lg px-3 py-1.5 text-xs font-semibold text-black" : "rounded-lg border border-border px-3 py-1.5 text-xs"}>{a}</Soon>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {moreHref && messages.length > feed.length && (
        <Link href={moreHref} className="block border-t border-border py-2.5 text-center text-xs font-medium text-gold-text hover:bg-surface">
          See all {messages.length} messages →
        </Link>
      )}
    </Card>
  );
}
