"use client";

import clsx from "clsx";
import { CalendarCheck } from "lucide-react";
import { useState } from "react";

export type Busy = { day: string; hour: number; label: string };
const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i); // 8 AM – 6 PM
const h12 = (h: number) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;

/**
 * Pick the site-visit time while seeing the whole week: busy hours are grey with what's there,
 * free hours are tappable. Days scroll sideways on the phone.
 */
export function WeekPicker({ days, busy }: { days: { key: string; label: string; sub: string }[]; busy: Busy[] }) {
  const [sel, setSel] = useState<{ day: string; hour: number } | null>(null);
  const [type, setType] = useState("Site visit");
  const at = (day: string, hour: number) => busy.find((b) => b.day === day && b.hour === hour);
  const selDay = days.find((d) => d.key === sel?.day);

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {["Site visit", "Second meeting", "Phone call"].map((t) => (
          <button key={t} type="button" onClick={() => setType(t)} className={clsx("rounded-full border px-3 py-1 text-xs", type === t ? "border-gold bg-gold-soft font-semibold text-gold-text" : "border-border text-muted")}>{t}</button>
        ))}
      </div>
      <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border">
        <div className="grid min-w-[620px]" style={{ gridTemplateColumns: `44px repeat(${days.length}, minmax(0,1fr))` }}>
          <div className="border-b border-border bg-surface" />
          {days.map((d) => (
            <div key={d.key} className="border-b border-l border-border bg-surface px-1 py-1.5 text-center">
              <div className="text-xs font-semibold">{d.label}</div>
              <div className="text-[10px] text-muted">{d.sub}</div>
            </div>
          ))}
          {HOURS.map((h) => (
            <div key={h} className="contents">
              <div className="border-b border-border py-1 pr-1 text-right text-[10px] text-muted">{h12(h)}</div>
              {days.map((d) => {
                const b = at(d.key, h);
                const on = sel?.day === d.key && sel.hour === h;
                return b ? (
                  <div key={d.key} className="truncate border-b border-l border-border bg-surface px-1 py-1 text-[10px] text-muted" title={b.label}>{b.label}</div>
                ) : (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setSel({ day: d.key, hour: h })}
                    className={clsx("border-b border-l border-border py-1 text-[10px] transition", on ? "gold-gradient font-bold text-black" : "hover:bg-gold-soft")}
                  >
                    {on ? "✓" : ""}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className={clsx("mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm", sel ? "bg-ok-soft text-ok" : "bg-surface text-muted")}>
        <CalendarCheck className="size-4" />
        {sel && selDay ? <span><b>{type}</b> · {selDay.label} {selDay.sub} at {h12(sel.hour)} — goes on the calendar, customer gets a reminder the day before</span> : "Tap a free hour to book it (optional)"}
      </div>
    </div>
  );
}
