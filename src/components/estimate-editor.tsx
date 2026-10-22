"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { saveEstimate } from "@/app/actions/estimates";
import { depositFor, paymentRows, totalOf } from "@/lib/estimate-math";
import { ESTIMATE_TEMPLATES, type EstimateSection, type EstimateStage } from "@/lib/estimate-templates";
import { money } from "@/lib/format";

export type EditorValue = {
  id?: string;
  leadId: string;
  customer: { name: string; email: string; phone: string; address: string };
  title: string;
  note: string;
  sections: EstimateSection[];
  exclusions: string[];
  schedule: EstimateStage[];
  validDays: number;
};

const field = "w-full rounded-lg border border-border bg-card px-3 py-2 text-base sm:text-sm outline-none focus:border-gold";
const label = "mb-1 block text-xs font-medium text-muted";

/** Build or edit an estimate. Prices per section; the total, deposit and payments are calculated. */
export function EstimateEditor({ initial, suggested }: { initial: EditorValue; suggested?: string }) {
  const [v, setV] = useState(initial);
  const [msg, action, pending] = useActionState(saveEstimate, null);
  const set = <K extends keyof EditorValue>(k: K, val: EditorValue[K]) => setV((x) => ({ ...x, [k]: val }));
  const setSection = (i: number, patch: Partial<EstimateSection>) => set("sections", v.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i: number, d: number) => {
    const xs = [...v.sections];
    const [it] = xs.splice(i, 1);
    xs.splice(i + d, 0, it);
    set("sections", xs);
  };
  const total = totalOf(v.sections);
  const pct = v.schedule.reduce((a, s) => a + (Number(s.pct) || 0), 0);
  const applyTemplate = (key: string) => {
    const t = ESTIMATE_TEMPLATES.find((x) => x.key === key);
    if (!t) return;
    const touched = v.sections.some((s) => s.price || s.items.length);
    if (touched && !confirm("Replace the sections with this template?")) return;
    setV((x) => ({ ...x, title: t.title || x.title, sections: t.sections.map((s) => ({ ...s, items: [...s.items] })), exclusions: [...t.exclusions], schedule: t.schedule.map((s) => ({ ...s })) }));
  };

  return (
    <form action={action} className="space-y-4 pb-28">
      <input type="hidden" name="data" value={JSON.stringify(v)} />

      {!initial.id && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 text-sm font-semibold">Start from a template</div>
          <div className="flex flex-wrap gap-1.5">
            {ESTIMATE_TEMPLATES.map((t) => (
              <button key={t.key} type="button" onClick={() => applyTemplate(t.key)} className={`rounded-full border px-3 py-1 text-xs font-medium ${t.key === suggested ? "border-gold bg-gold-soft text-gold-text" : "border-border hover:border-gold"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
        <label><span className={label}>Customer name</span><input className={field} value={v.customer.name} onChange={(e) => set("customer", { ...v.customer, name: e.target.value })} /></label>
        <label><span className={label}>Phone</span><input className={field} inputMode="tel" value={v.customer.phone} onChange={(e) => set("customer", { ...v.customer, phone: e.target.value })} /></label>
        <label><span className={label}>Email</span><input className={field} type="email" value={v.customer.email} onChange={(e) => set("customer", { ...v.customer, email: e.target.value })} /></label>
        <label><span className={label}>Job address</span><input className={field} value={v.customer.address} onChange={(e) => set("customer", { ...v.customer, address: e.target.value })} /></label>
        <label className="sm:col-span-2"><span className={label}>Title — what the job is</span><input className={field} value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="New retaining wall — 95 LF CMU with stucco" /></label>
        <label className="sm:col-span-2"><span className={label}>Personal note (starts with “Hi {v.customer.name.split(" ")[0] || "…"},”)</span><textarea className={field} rows={3} value={v.note} onChange={(e) => set("note", e.target.value)} /></label>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold">Scope & prices</h2>
          <span className="text-sm">Total <b>{money(total)}</b></span>
        </div>
        {v.sections.map((s, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <span className="mt-2 text-sm font-semibold text-muted">{i + 1}.</span>
              <input className={`${field} min-w-0 flex-1 basis-[80%]`} value={s.title} placeholder="Section (e.g. Demolition)" onChange={(e) => setSection(i, { title: e.target.value })} />
              <div className="relative ml-auto w-36 shrink-0">
                <span className="pointer-events-none absolute left-3 top-2 text-sm text-muted">$</span>
                <input className={`${field} pl-6 text-right`} inputMode="numeric" value={s.price || ""} placeholder="0" onChange={(e) => setSection(i, { price: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })} />
              </div>
            </div>
            <textarea className={`${field} mt-2`} rows={Math.max(3, s.items.length + 1)} placeholder="What's included — one line each" value={s.items.join("\n")} onChange={(e) => setSection(i, { items: e.target.value.split("\n") })} />
            <div className="mt-2 flex justify-end gap-1 text-muted">
              {i > 0 && <button type="button" onClick={() => move(i, -1)} className="rounded-lg border border-border p-1.5" aria-label="Move up"><ArrowUp className="size-4" /></button>}
              {i < v.sections.length - 1 && <button type="button" onClick={() => move(i, 1)} className="rounded-lg border border-border p-1.5" aria-label="Move down"><ArrowDown className="size-4" /></button>}
              <button type="button" onClick={() => set("sections", v.sections.filter((_, j) => j !== i))} className="rounded-lg border border-border p-1.5 text-bad" aria-label="Remove section"><Trash2 className="size-4" /></button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => set("sections", [...v.sections, { title: "", items: [], price: 0 }])} className="flex w-full items-center justify-center gap-1 rounded-2xl border border-dashed border-border py-3 text-sm font-medium text-gold-text"><Plus className="size-4" /> Add section</button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <label><span className={label}>Not included — one per line</span><textarea className={field} rows={3} value={v.exclusions.join("\n")} onChange={(e) => set("exclusions", e.target.value.split("\n"))} /></label>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Payment schedule</h2>
          <span className={`text-xs font-semibold ${Math.round(pct) === 100 ? "text-ok" : "text-bad"}`}>{pct}% of the rest {Math.round(pct) === 100 ? "✓" : "(needs 100%)"}</span>
        </div>
        <div className="mb-2 flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm"><span>Deposit (on approval) — $1,000 or 10%, whichever is less</span><b>{money(depositFor(total))}</b></div>
        <div className="space-y-2">
          {v.schedule.map((s, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 border-b border-border pb-2 last:border-0 sm:flex-nowrap sm:border-0 sm:pb-0">
              <input className={`${field} basis-full sm:basis-auto`} value={s.name} onChange={(e) => set("schedule", v.schedule.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Upon …" />
              <div className="relative ml-auto w-20 shrink-0 sm:ml-0">
                <input className={`${field} pr-6 text-right`} inputMode="numeric" value={s.pct || ""} onChange={(e) => set("schedule", v.schedule.map((x, j) => (j === i ? { ...x, pct: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0 } : x)))} />
                <span className="pointer-events-none absolute right-2 top-2 text-sm text-muted">%</span>
              </div>
              <span className="w-24 shrink-0 text-right text-sm font-semibold">{money(paymentRows(total, v.schedule)[i + 1]?.amount ?? 0)}</span>
              <button type="button" onClick={() => set("schedule", v.schedule.filter((_, j) => j !== i))} className="shrink-0 p-1 text-bad" aria-label="Remove stage"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set("schedule", [...v.schedule, { name: "", pct: 0 }])} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-gold-text"><Plus className="size-4" /> Add stage</button>
        <label className="mt-3 flex items-center gap-2 text-sm text-muted">Valid for <input className={`${field} w-20`} inputMode="numeric" value={v.validDays} onChange={(e) => set("validDays", Number(e.target.value.replace(/[^0-9]/g, "")) || 30)} /> days</label>
      </section>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-60">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1 text-sm">
            <div>Total <b className="text-lg">{money(total)}</b></div>
            {msg && <div className="truncate text-xs text-bad">{msg}</div>}
          </div>
          <button disabled={pending} className="gold-gradient rounded-xl px-5 py-3 text-sm font-bold text-black disabled:opacity-60">{pending ? "Saving…" : "Save & preview"}</button>
        </div>
      </div>
    </form>
  );
}
