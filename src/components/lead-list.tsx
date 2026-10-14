"use client";

import clsx from "clsx";
import { Check, MessageSquare, Phone, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { closeLead, reopenLead } from "@/app/actions/leads";
import { SourceBadge } from "./status";
import type { LeadSource } from "@/lib/types";

export type LeadRow = {
  id: string;
  name: string;
  source: LeadSource;
  service: string;
  city: string;
  phone: string;
  day: string; // group label: Today / Yesterday / Oct 7
  status: string;
  tone: "bad" | "warn" | "ok" | "gold" | "muted";
  last?: string;
  closedOn?: string;
};

const TONE = { bad: "bg-bad-soft text-bad", warn: "bg-warn-soft text-warn", ok: "bg-ok-soft text-ok", gold: "bg-gold-soft text-gold-text", muted: "bg-surface text-muted" };

/**
 * This week's leads. Tap ✓ when a lead is closed (meeting booked / done) — it leaves the open
 * list and moves to "Closed this week"; a week later it's only in the yearly list.
 */
export function LeadList({ open: initialOpen, closed: initialClosed }: { open: LeadRow[]; closed: LeadRow[] }) {
  const [open, setOpen] = useState(initialOpen);
  const [closed, setClosed] = useState(initialClosed);
  const [tab, setTab] = useState<"open" | "closed">("open");
  const [, start] = useTransition();

  const close = (r: LeadRow) => {
    setOpen((o) => o.filter((x) => x.id !== r.id));
    setClosed((c) => [{ ...r, status: "Closed ✓", tone: "ok", closedOn: "Today" }, ...c]);
    start(() => closeLead(r.id));
  };
  const undo = (r: LeadRow) => {
    setClosed((c) => c.filter((x) => x.id !== r.id));
    const orig = initialOpen.find((x) => x.id === r.id);
    if (orig) setOpen((o) => [orig, ...o]);
    start(() => reopenLead(r.id));
  };

  const rows = tab === "open" ? open : closed;
  const groups = rows.reduce<Record<string, LeadRow[]>>((acc, r) => ((acc[tab === "open" ? r.day : (r.closedOn ?? r.day)] ??= []).push(r), acc), {});

  return (
    <div>
      <div className="mb-3 flex gap-1">
        {([["open", `Open · ${open.length}`], ["closed", `Closed this week · ${closed.length}`]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={clsx("rounded-full border px-3.5 py-1.5 text-sm", tab === k ? "border-gold bg-gold-soft font-semibold text-gold-text" : "border-border text-muted")}>
            {label}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {Object.entries(groups).map(([day, ls]) => (
          <div key={day}>
            <div className="border-b border-border bg-surface px-4 py-1.5 text-xs font-semibold text-muted">{day} · {ls.length}</div>
            <ul className="divide-y divide-border border-b border-border">
              {ls.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <Link href={`/leads/${r.id}`} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-semibold">{r.name}</span>
                      <SourceBadge source={r.source} />
                      <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-semibold", TONE[r.tone])}>{r.status}</span>
                    </div>
                    <div className="truncate text-xs text-muted">{r.service} · {r.city}</div>
                    {r.last && <div className="truncate text-xs text-muted">{r.last}</div>}
                  </Link>
                  {tab === "open" ? (
                    <div className="flex shrink-0 gap-1.5">
                      <a href={`tel:${r.phone}`} className="flex size-10 items-center justify-center rounded-xl border border-border hover:bg-surface" aria-label="Call"><Phone className="size-4" /></a>
                      <Link href={`/leads/${r.id}`} className="flex size-10 items-center justify-center rounded-xl border border-border hover:bg-surface" aria-label="Message"><MessageSquare className="size-4" /></Link>
                      <button onClick={() => close(r)} className="flex size-10 items-center justify-center rounded-xl bg-ok text-white" aria-label="Closed"><Check className="size-5" /></button>
                    </div>
                  ) : (
                    <button onClick={() => undo(r)} className="flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs text-muted hover:bg-surface"><RotateCcw className="size-3.5" /> Undo</button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!rows.length && <div className="p-8 text-center text-sm text-muted">{tab === "open" ? "All caught up 🎉" : "Nothing closed yet this week"}</div>}
      </div>
      <p className="mt-2 text-[11px] text-muted">
        ✓ = closed (meeting booked or done) → moves to “Closed this week”. After a week it&apos;s only in All leads. No answer for 7 days → drops off by itself.
      </p>
    </div>
  );
}
