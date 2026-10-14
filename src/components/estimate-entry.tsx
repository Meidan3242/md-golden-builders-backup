"use client";

import { FileUp, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SourceBadge } from "./status";
import type { LeadSource } from "@/lib/types";

type Row = { id: string; name: string; source: LeadSource; service: string; city: string; visited: string; days: number };

/** "Need to send estimate": type the price, attach the Joist PDF, tap Sent — the lead moves to follow-ups. */
export function EstimateEntry({ rows: initial }: { rows: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [done, setDone] = useState<string[]>([]);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const send = (r: Row) => {
    setRows((x) => x.filter((y) => y.id !== r.id));
    setDone((d) => [`${r.name} — $${Number(amounts[r.id] || 0).toLocaleString()} sent. Follow-up Day 1 is tomorrow.`, ...d]);
  };

  return (
    <div className="space-y-3">
      {done.map((d) => <div key={d} className="rounded-xl bg-ok-soft px-4 py-2.5 text-sm font-medium text-ok">✓ {d}</div>)}
      {rows.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-card p-4">
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
              <input inputMode="numeric" placeholder="Estimate amount" value={amounts[r.id] ?? ""} onChange={(e) => setAmounts((a) => ({ ...a, [r.id]: e.target.value.replace(/[^0-9]/g, "") }))} className="w-full bg-transparent px-1 py-2 text-sm outline-none" />
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted hover:border-gold">
              <FileUp className="size-4 shrink-0" />
              <span className="truncate">{files[r.id] ?? "Attach Joist PDF"}</span>
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFiles((x) => ({ ...x, [r.id]: f.name })); }} />
            </label>
            <button disabled={!amounts[r.id]} onClick={() => send(r)} className="gold-gradient inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-black disabled:opacity-40">
              <Send className="size-4" /> Estimate sent
            </button>
          </div>
        </div>
      ))}
      {!rows.length && <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted">All estimates are out 🎉</div>}
      <p className="text-[11px] text-muted">Later: connect Joist (forward Joist&apos;s emails to the app) and the PDF + price come in by themselves — the lead leaves this list automatically.</p>
    </div>
  );
}
