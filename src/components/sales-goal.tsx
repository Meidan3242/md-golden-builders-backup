"use client";

import clsx from "clsx";
import { Check, Pencil, Target } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "md-sales-goal";
const fmt = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const short = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : fmt(n));
const monthName = (m: string, long = false) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-US", { month: long ? "long" : "short", timeZone: "UTC" });

/** Monthly sales goal. Every signed contract (and change order) adds to the month it was signed. */
export function SalesGoal({ months, initialGoal }: { months: { month: string; sold: number; jobs: number }[]; initialGoal: number }) {
  const [goal, setGoal] = useState(initialGoal);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(initialGoal));
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(KEY));
      if (saved > 0) { setGoal(saved); setDraft(String(saved)); }
    } catch {}
  }, []);
  const save = () => {
    const n = Number(draft.replace(/[^0-9]/g, ""));
    if (n > 0) { setGoal(n); try { localStorage.setItem(KEY, String(n)); } catch {} }
    setEditing(false);
  };

  const now = months[months.length - 1];
  const past = months.slice(-7, -1);
  const pctNow = Math.min(1, now.sold / goal);
  const hit = past.filter((m) => m.sold >= goal).length;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold"><Target className="size-4 text-gold-text" /> Sales goal — {monthName(now.month, true)}</div>
        {editing ? (
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted">$</span>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} inputMode="numeric" autoFocus className="w-28 rounded-lg border border-border bg-surface px-2 py-1 text-sm" />
            <button onClick={save} className="gold-gradient rounded-lg p-1.5 text-black" aria-label="Save goal"><Check className="size-4" /></button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-xs font-medium text-gold-text"><Pencil className="size-3.5" /> Goal {fmt(goal)} · change</button>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div><span className="text-3xl font-bold">{fmt(now.sold)}</span> <span className="text-sm text-muted">of {fmt(goal)}</span></div>
        <div className="text-right text-sm"><b>{Math.round((now.sold / goal) * 100)}%</b><div className="text-xs text-muted">{now.jobs} jobs signed · {fmt(Math.max(0, goal - now.sold))} to go</div></div>
      </div>
      <div className="mt-2 h-3 rounded-full bg-surface"><div className="gold-gradient h-3 rounded-full" style={{ width: `${pctNow * 100}%` }} /></div>

      <div className="mt-4 text-xs text-muted">Last 6 months — hit the goal {hit} of 6</div>
      <div className="mt-2 grid grid-cols-6 gap-2">
        {past.map((m) => {
          const ok = m.sold >= goal;
          return (
            <div key={m.month} className="text-center" title={`${monthName(m.month, true)}: ${fmt(m.sold)}`}>
              <div className="relative mx-auto h-16 w-full max-w-10 rounded bg-surface">
                <div className={clsx("absolute inset-x-0 bottom-0 rounded", ok ? "bg-ok" : "bg-gold/60")} style={{ height: `${Math.min(1, m.sold / goal) * 100}%` }} />
              </div>
              <div className="mt-1 text-[11px] font-semibold">{short(m.sold)}</div>
              <div className={clsx("text-[10px]", ok ? "font-semibold text-ok" : "text-muted")}>{monthName(m.month)} {ok ? "✓" : "✗"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
