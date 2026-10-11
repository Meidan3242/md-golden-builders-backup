"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import { useState } from "react";
import { money } from "@/lib/format";

type Option = { id: string; title: string; detail: string; price: number };
type Milestone = { name: string; pct: number | null; amount?: number };

/** Optional add-ons the customer can tick; the total and payment schedule update live. */
export function EstimateOptions({ base, options, schedule }: { base: number; options: Option[]; schedule: Milestone[] }) {
  const [picked, setPicked] = useState<string[]>(["drain"]);
  const extras = options.filter((o) => picked.includes(o.id)).reduce((a, o) => a + o.price, 0);
  const total = base + extras;
  const deposit = Math.min(1000, Math.round(total * 0.1));
  const rest = total - deposit;

  return (
    <>
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold">Recommended add-ons</h2>
        <p className="mb-3 text-sm text-muted">Tap to add or remove — your total updates instantly.</p>
        <div className="space-y-2">
          {options.map((o) => {
            const on = picked.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setPicked((p) => (on ? p.filter((x) => x !== o.id) : [...p, o.id]))}
                className={clsx("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition", on ? "border-gold bg-gold-soft" : "border-border hover:bg-surface")}
              >
                <span className={clsx("flex size-5 shrink-0 items-center justify-center rounded-md border", on ? "gold-gradient border-transparent text-black" : "border-border")}>{on && <Check className="size-3.5" />}</span>
                <span className="flex-1"><span className="block text-sm font-semibold">{o.title}</span><span className="block text-xs text-muted">{o.detail}</span></span>
                <span className="text-sm font-semibold">+{money(o.price)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-lg font-bold">Your investment</h2>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted">Project as described</span><span>{money(base)}</span></div>
          {options.filter((o) => picked.includes(o.id)).map((o) => (
            <div key={o.id} className="flex justify-between"><span className="text-muted">{o.title}</span><span>{money(o.price)}</span></div>
          ))}
          <div className="flex justify-between border-t border-border pt-2 text-xl font-bold"><span>Total</span><span>{money(total)}</span></div>
        </div>

        <h3 className="mt-5 mb-2 text-sm font-semibold">Payment schedule</h3>
        <ol className="space-y-1.5 text-sm">
          {schedule.map((m, i) => (
            <li key={m.name} className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2">
              <span className="gold-gradient flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-black">{i + 1}</span>
              <span className="flex-1">{m.name}</span>
              <span className="font-semibold">{money(m.pct === null ? deposit : Math.round(rest * m.pct))}</span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[11px] text-muted">Deposit is $1,000 or 10% of the contract, whichever is less (California law). You only pay each milestone after that work is done.</p>
      </section>
    </>
  );
}
