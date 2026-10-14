"use client";

import { FileUp, Send } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { markEstimateSent } from "@/app/actions/leads";
import { SourceBadge } from "./status";
import type { LeadSource } from "@/lib/types";

type Row = { id: string; name: string; source: LeadSource; service: string; city: string; visited: string; days: number };

/** "Need to send estimate": type the price, attach the Joist PDF, tap Sent — the lead moves to follow-ups. */
export function EstimateEntry({ rows }: { rows: Row[] }) {
  const [done, setDone] = useState<string[]>([]);
  const visible = rows.filter((r) => !done.includes(r.id));
  return (
    <div className="space-y-3">
      {rows.filter((r) => done.includes(r.id)).map((r) => (
        <div key={r.id} className="rounded-xl bg-ok-soft px-4 py-2.5 text-sm font-medium text-ok">✓ {r.name} — estimate sent. Follow-up Day 1 is tomorrow.</div>
      ))}
      {visible.map((r) => <EstimateRow key={r.id} r={r} onDone={() => setDone((d) => [...d, r.id])} />)}
      {!visible.length && <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted">All estimates are out 🎉</div>}
      <p className="text-[11px] text-muted">Later: connect Joist (forward Joist&apos;s emails to the app) and the PDF + price come in by themselves — the lead leaves this list automatically.</p>
    </div>
  );
}

function EstimateRow({ r, onDone }: { r: Row; onDone: () => void }) {
  const [file, setFile] = useState<string>();
  const [amount, setAmount] = useState("");
  const [msg, action, pending] = useActionState(async (prev: string | null, form: FormData) => {
    const res = await markEstimateSent(prev, form);
    if (!res || res.startsWith("Demo")) onDone();
    return res;
  }, null);
  return (
    <form action={action} className="rounded-xl border border-border bg-card p-4">
      <input type="hidden" name="id" value={r.id} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`/leads/${r.id}`} className="min-w-0">
          <div className="flex items-center gap-2"><span className="font-semibold">{r.name}</span><SourceBadge source={r.source} /></div>
          <div className="text-xs text-muted">{r.service} · {r.city} · visited {r.visited}</div>
        </Link>
        <span className={r.days >= 3 ? "rounded-full bg-bad-soft px-2 py-0.5 text-xs font-semibold text-bad" : "rounded-full bg-surface px-2 py-0.5 text-xs text-muted"}>waiting {r.days} days</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <label className="flex items-center rounded-lg border border-border bg-surface px-3">
          <span className="text-sm text-muted">$</span>
          <input name="amount" inputMode="numeric" placeholder="Estimate amount" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} className="w-full bg-transparent px-1 py-2 text-sm outline-none" />
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted hover:border-gold">
          <FileUp className="size-4 shrink-0" />
          <span className="truncate">{file ?? "Attach Joist PDF"}</span>
          <input name="pdf" type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0]?.name)} />
        </label>
        <button disabled={!amount || pending} className="gold-gradient inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-black disabled:opacity-40">
          <Send className="size-4" /> {pending ? "Saving…" : "Estimate sent"}
        </button>
      </div>
      {msg && !msg.startsWith("Demo") && <p className="mt-2 text-sm text-bad">{msg}</p>}
    </form>
  );
}
