import clsx from "clsx";
import { Camera, CheckCircle2, FileText, Image as ImageIcon, Mic, Paperclip, Send, Sparkles } from "lucide-react";
import { Avatar, Badge, Card } from "./ui";
import { userById } from "@/lib/data";
import { dateTime } from "@/lib/format";
import type { ChatMessage } from "@/lib/types";

const COMMANDS = [
  ["/received", "customer paid"],
  ["/paid", "paid a sub"],
  ["/expense", "receipt"],
  ["/co", "change order"],
  ["/task", "to-do"],
];

export function ProjectChat({ messages, me }: { messages: ChatMessage[]; me: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="flex flex-col lg:col-span-2">
        <div className="flex-1 space-y-4 p-4">
          {messages.map((m) => {
            const mine = m.by === me;
            const u = userById(m.by);
            return (
              <div key={m.id} className={clsx("flex gap-2", mine && "flex-row-reverse")}>
                <Avatar initials={u?.initials ?? "?"} className="mt-1" />
                <div className={clsx("max-w-[85%] space-y-1.5", mine && "items-end text-right")}>
                  <div className="text-[11px] text-muted">{u?.name} · {dateTime(m.at)}</div>
                  {(m.text || m.attachment) && (
                    <div className={clsx("inline-block rounded-2xl px-3 py-2 text-left text-sm", mine ? "bg-gold-soft" : "bg-surface")}>
                      {m.attachment && (
                        <div className="mb-1 flex items-center gap-2 rounded-lg bg-card px-2 py-1.5 text-xs">
                          {m.attachment.kind === "pdf" ? <FileText className="size-4 text-bad" /> : <ImageIcon className="size-4 text-info" />}
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
                      <div className="mt-2 flex items-start gap-1.5 border-t border-border pt-2 text-[11px] text-muted">
                        <CheckCircle2 className="mt-px size-3 shrink-0 text-ok" /> {m.capture.destination}
                      </div>
                      {m.capture.status !== "Saved" && (
                        <div className="mt-2 flex gap-2">
                          <button className="gold-gradient rounded-lg px-3 py-1 text-xs font-semibold text-black">Confirm</button>
                          <button className="rounded-lg border border-border px-3 py-1 text-xs">Edit</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border p-3">
          <div className="scrollbar-thin mb-2 flex gap-1.5 overflow-x-auto">
            {COMMANDS.map(([c, d]) => (
              <span key={c} className="whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-[11px]"><b className="font-mono">{c}</b> <span className="text-muted">{d}</span></span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg p-2 text-muted hover:bg-surface" aria-label="Camera"><Camera className="size-5" /></button>
            <button className="rounded-lg p-2 text-muted hover:bg-surface" aria-label="Attach"><Paperclip className="size-5" /></button>
            <div className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted">Type, drop a screenshot, or say it…</div>
            <button className="rounded-lg p-2 text-muted hover:bg-surface" aria-label="Voice note"><Mic className="size-5" /></button>
            <button className="gold-gradient rounded-full p-2 text-black" aria-label="Send"><Send className="size-4" /></button>
          </div>
        </div>
      </Card>

      <Card className="h-fit p-4 text-sm">
        <div className="mb-2 flex items-center gap-1.5 font-semibold"><Sparkles className="size-4 text-gold-text" /> Smart capture</div>
        <p className="text-xs text-muted">Write like you write in WhatsApp. The assistant reads the text and the screenshot, files it in the right place, and updates the money summary.</p>
        <ul className="mt-3 space-y-2 text-xs">
          <li className="rounded-lg bg-surface p-2"><b>“Customer paid 5000 zelle contract 2”</b> + screenshot → Payments › Contract #2</li>
          <li className="rounded-lg bg-surface p-2"><b>“/paid juan 1000 check 1187”</b> + photo of check → Subcontractors › Juan · proof saved · waiver requested</li>
          <li className="rounded-lg bg-surface p-2"><b>Receipt photo</b> → Expenses (vendor, amount, date read from the photo)</li>
          <li className="rounded-lg bg-surface p-2"><b>Sub invoice PDF</b> → Subcontractors › invoices, waiting for approval</li>
          <li className="rounded-lg bg-surface p-2"><b>Voice note</b> → typed out, then filed the same way</li>
        </ul>
        <p className="mt-3 text-[11px] text-muted">Money is never saved silently: anything unclear asks for one-tap confirmation, and every entry can be undone.</p>
      </Card>
    </div>
  );
}
