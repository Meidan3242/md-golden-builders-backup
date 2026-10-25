"use client";

import { ArrowDown, ArrowLeft, ArrowUp, Camera, ChevronRight, ImageIcon, Plus, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { saveEstimate, uploadEstimatePhoto } from "@/app/actions/estimates";
import { depositFor, paymentRows, totalOf } from "@/lib/estimate-math";
import { ESTIMATE_TEMPLATES, type EstimateSection, type EstimateStage } from "@/lib/estimate-templates";
import { money } from "@/lib/format";
import { shrinkImage } from "@/lib/shrink";

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
const STEPS = ["Customer", "Items", "Payments"];
export const photoSrc = (id: string) => `/estimates/photo/${id}`;

/** Build or edit an estimate in 3 steps: customer → items (each opens big, with its photos) → payments. */
export function EstimateEditor({ initial, suggested }: { initial: EditorValue; suggested?: string }) {
  const [v, setV] = useState(initial);
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [msg, action, pending] = useActionState(saveEstimate, null);
  const set = <K extends keyof EditorValue>(k: K, val: EditorValue[K]) => setV((x) => ({ ...x, [k]: val }));
  const setSection = (i: number, patch: Partial<EstimateSection>) => setV((x) => ({ ...x, sections: x.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const move = (i: number, d: number) => {
    const xs = [...v.sections];
    const [it] = xs.splice(i, 1);
    xs.splice(i + d, 0, it);
    set("sections", xs);
    setOpen(i + d);
  };
  const remove = (i: number) => {
    if (!confirm(`Remove item ${i + 1}${v.sections[i].title ? ` (${v.sections[i].title})` : ""}?`)) return;
    set("sections", v.sections.filter((_, j) => j !== i));
    setOpen(null);
  };
  const add = () => {
    set("sections", [...v.sections, { title: "", items: [], price: 0, photos: [] }]);
    setOpen(v.sections.length);
  };
  const total = totalOf(v.sections);
  const pct = v.schedule.reduce((a, s) => a + (Number(s.pct) || 0), 0);
  const applyTemplate = (key: string) => {
    const t = ESTIMATE_TEMPLATES.find((x) => x.key === key);
    if (!t) return;
    const touched = v.sections.some((s) => s.price || s.items.length || s.photos?.length);
    if (touched && !confirm("Replace the items with this template?")) return;
    setV((x) => ({ ...x, title: t.title || x.title, sections: t.sections.map((s) => ({ ...s, items: [...s.items], photos: [] })), exclusions: [...t.exclusions], schedule: t.schedule.map((s) => ({ ...s })) }));
  };
  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0 });
  };

  return (
    // Enter in a one-line field must not send the form
    <form action={action} className="space-y-4 pb-28" onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT" && e.preventDefault()}>
      <input type="hidden" name="data" value={JSON.stringify(v)} />

      <nav className="grid grid-cols-3 gap-1.5">
        {STEPS.map((s, i) => (
          <button key={s} type="button" onClick={() => go(i)} className={`rounded-xl border px-2 py-2 text-left text-xs ${i === step ? "border-gold bg-gold-soft text-gold-text" : "border-border bg-card text-muted"}`}>
            <span className="block text-[10px] uppercase tracking-wider">Step {i + 1}</span>
            <span className="font-semibold">{s}</span>
          </button>
        ))}
      </nav>

      {step === 0 && (
        <>
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
            <label className="sm:col-span-2"><span className={label}>Personal note (starts with “Dear {v.customer.name.split(" ")[0] || "…"},”)</span><textarea className={field} rows={4} value={v.note} onChange={(e) => set("note", e.target.value)} /></label>
          </section>
        </>
      )}

      {step === 1 && (
        <section className="space-y-2.5">
          <p className="px-1 text-xs text-muted">Tap an item to open it big — write and add photos.</p>
          {v.sections.map((s, i) => (
            <button key={i} type="button" onClick={() => setOpen(i)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:border-gold">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-soft text-sm font-bold text-gold-text">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{s.title || <span className="text-muted">Item {i + 1} — tap to write</span>}</span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  {s.items.filter((x) => x.trim()).length} lines
                  {!!s.photos?.length && <><ImageIcon className="size-3.5" /> {s.photos.length}</>}
                </span>
              </span>
              <span className={`shrink-0 text-sm font-semibold ${s.price ? "" : "text-bad"}`}>{s.price ? money(s.price) : "No price"}</span>
              <ChevronRight className="size-4 shrink-0 text-muted" />
            </button>
          ))}
          <button type="button" onClick={add} className="flex w-full items-center justify-center gap-1 rounded-2xl border border-dashed border-border py-4 text-sm font-medium text-gold-text"><Plus className="size-4" /> Add item</button>
        </section>
      )}

      {step === 2 && (
        <>
          <section className="rounded-2xl border border-border bg-card p-4">
            <label><span className={label}>Not included — one per line</span><textarea className={field} rows={4} value={v.exclusions.join("\n")} onChange={(e) => set("exclusions", e.target.value.split("\n"))} /></label>
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
        </>
      )}

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-60">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          {step > 0 && <button type="button" onClick={() => go(step - 1)} className="rounded-xl border border-border px-3 py-3" aria-label="Back"><ArrowLeft className="size-4" /></button>}
          <div className="min-w-0 flex-1 text-sm">
            <div>Total <b className="text-lg">{money(total)}</b></div>
            {msg && <div className="truncate text-xs text-bad">{msg}</div>}
          </div>
          {step < 2 ? (
            // separate keys: reusing the same button would turn the "Next" click into a submit
            <button key="next" type="button" onClick={() => go(step + 1)} className="gold-gradient rounded-xl px-5 py-3 text-sm font-bold text-black">Next: {STEPS[step + 1]}</button>
          ) : (
            <button key="save" disabled={pending} className="gold-gradient rounded-xl px-5 py-3 text-sm font-bold text-black disabled:opacity-60">{pending ? "Saving…" : "Save & preview"}</button>
          )}
        </div>
      </div>

      {open !== null && v.sections[open] && (
        <ItemSheet
          key={open}
          n={open}
          count={v.sections.length}
          value={v.sections[open]}
          onChange={(patch) => setSection(open, patch)}
          onClose={() => setOpen(null)}
          onMove={(d) => move(open, d)}
          onRemove={() => remove(open)}
        />
      )}
    </form>
  );
}

/** One item, full screen: big title, price and lines, and its photos. */
function ItemSheet({ n, count, value: s, onChange, onClose, onMove, onRemove }: {
  n: number; count: number; value: EstimateSection;
  onChange: (p: Partial<EstimateSection>) => void; onClose: () => void; onMove: (d: number) => void; onRemove: () => void;
}) {
  const [text, setText] = useState(s.items.join("\n"));
  const [up, setUp] = useState<string>();
  const file = useRef<HTMLInputElement>(null);
  const photos = s.photos ?? [];

  useEffect(() => {
    // the page under the sheet must not scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const writeLines = (t: string) => {
    setText(t);
    onChange({ items: t.split("\n") });
  };
  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const added: string[] = [];
    const failed: string[] = [];
    for (const [i, f] of [...files].entries()) {
      setUp(`Uploading ${i + 1} of ${files.length}…`);
      const form = new FormData();
      form.set("file", await shrinkImage(f));
      try {
        const r = await uploadEstimatePhoto(form);
        if ("id" in r) added.push(r.id);
        else failed.push(r.error);
      } catch {
        failed.push("Upload failed — try again.");
      }
    }
    onChange({ photos: [...photos, ...added] });
    setUp(failed.length ? failed[0] : undefined);
    if (file.current) file.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg" role="dialog" aria-label={`Item ${n + 1}`}>
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="grid size-8 place-items-center rounded-full bg-gold-soft text-sm font-bold text-gold-text">{n + 1}</span>
        <span className="flex-1 text-sm text-muted">Item {n + 1} of {count}</span>
        <button type="button" onClick={onClose} className="gold-gradient rounded-xl px-4 py-2 text-sm font-bold text-black">Done</button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 p-4 pb-10">
          <input className="w-full border-b border-border bg-transparent pb-2 text-2xl font-bold outline-none focus:border-gold" value={s.title} placeholder="Item name (e.g. Demolition)" onChange={(e) => onChange({ title: e.target.value })} />

          <label className="flex items-center gap-3">
            <span className="text-sm text-muted">Price</span>
            <span className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl text-muted">$</span>
              <input className="w-full rounded-xl border border-border bg-card py-3 pl-8 pr-3 text-2xl font-semibold tabular-nums outline-none focus:border-gold" inputMode="numeric" placeholder="0" value={s.price ? s.price.toLocaleString("en-US") : ""} onChange={(e) => onChange({ price: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })} />
            </span>
          </label>

          <label className="block">
            <span className={label}>What&apos;s included — one line each (the customer sees each line as a bullet)</span>
            <textarea className="min-h-56 w-full rounded-xl border border-border bg-card p-3 text-lg leading-relaxed outline-none focus:border-gold" rows={Math.max(7, text.split("\n").length + 2)} value={text} onChange={(e) => writeLines(e.target.value)} placeholder={"Remove the existing tub and tile\nHaul away all debris"} />
          </label>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Photos <span className="font-normal text-muted">— the customer sees them under this item</span></span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photos.map((p) => (
                <div key={p} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoSrc(p)} alt="" className="aspect-[4/3] w-full rounded-xl border border-border object-cover" />
                  <button type="button" onClick={() => onChange({ photos: photos.filter((x) => x !== p) })} className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white" aria-label="Remove photo"><X className="size-4" /></button>
                </div>
              ))}
              {photos.length < 8 && (
                <button type="button" disabled={!!up?.startsWith("Uploading")} onClick={() => file.current?.click()} className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-sm text-gold-text disabled:opacity-60">
                  <Camera className="size-6" /> {up?.startsWith("Uploading") ? up : "Add photo"}
                </button>
              )}
            </div>
            {up && !up.startsWith("Uploading") && <p className="mt-1 text-xs text-bad">{up}</p>}
            <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
          </section>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="flex gap-1">
              {n > 0 && <button type="button" onClick={() => onMove(-1)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm"><ArrowUp className="size-4" /> Up</button>}
              {n < count - 1 && <button type="button" onClick={() => onMove(1)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm"><ArrowDown className="size-4" /> Down</button>}
            </div>
            <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-bad"><Trash2 className="size-4" /> Remove item</button>
          </div>
        </div>
      </div>
    </div>
  );
}
