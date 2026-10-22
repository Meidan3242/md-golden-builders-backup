"use client";

import { Copy, Mail, MessageSquare } from "lucide-react";
import { useState } from "react";
import { emailEstimate, estimateSent } from "@/app/actions/estimates";

/** Text it from your phone, copy the link, or email it — each one marks the estimate as sent. */
export function SendEstimate({ id, link, phone, email, first, title, emailOn }: { id: string; link: string; phone: string; email: string; first: string; title: string; emailOn: boolean }) {
  const [text, setText] = useState(`Hi ${first}, it's Meidan from MD Golden Builders. Here's your estimate for ${title}: ${link}\nAny question, just text me.`);
  const [msg, setMsg] = useState<string>();
  // A plain busy flag (not a transition): the page refresh after sending must not keep the buttons locked.
  const [pending, setPending] = useState(false);
  const start = (run: () => Promise<void>) => {
    setPending(true);
    run().finally(() => setPending(false));
  };
  const sent = (r: string) => setMsg(r); // the action itself refreshes the page (revalidatePath)
  const digits = phone.replace(/[^0-9+]/g, "");
  const btn = "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold disabled:opacity-60";
  return (
    <div className="space-y-2">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            // iPhone wants "&body=", Android "?body=".
            const sep = /iPhone|iPad|Macintosh/.test(navigator.userAgent) ? "&" : "?";
            window.location.href = `sms:${digits}${sep}body=${encodeURIComponent(text)}`;
            start(async () => sent(await estimateSent(id)));
          }}
          className={`${btn} gold-gradient text-black`}
        >
          <MessageSquare className="size-4" /> Text it
        </button>
        <button type="button" disabled={pending} onClick={() => {
            // Copy right away (in the tap itself — phones require that); marking it sent doesn't wait for the copy.
            const copied = navigator.clipboard?.writeText(text).then(() => true, () => false) ?? Promise.resolve(false);
            start(async () => {
              const r = await estimateSent(id);
              const ok = await Promise.race([copied, new Promise<boolean>((done) => setTimeout(() => done(false), 1500))]);
              setMsg(r.startsWith("Failed") ? r : ok ? "Copied ✓ — paste it in any chat" : "Marked as sent — long-press the message above to copy it");
            });
          }} className={`${btn} border border-border bg-card`}>
          <Copy className="size-4" /> Copy
        </button>
        <button type="button" disabled={pending || !emailOn || !email} onClick={() => start(async () => sent(await emailEstimate(id)))} className={`${btn} border border-border bg-card`} title={!emailOn ? "Email isn't connected yet" : !email ? "No email on the estimate" : ""}>
          <Mail className="size-4" /> {pending ? "…" : "Email"}
        </button>
      </div>
      {!emailOn && <p className="text-[11px] text-muted">Email: not connected yet (one-time setup) — Text and Copy work now.</p>}
      {msg && <p className={`text-sm ${msg.startsWith("Failed") ? "text-bad" : "text-ok"}`}>{msg}</p>}
    </div>
  );
}
