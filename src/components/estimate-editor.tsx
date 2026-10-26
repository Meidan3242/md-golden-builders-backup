"use client";

import { ArrowDown, ArrowLeft, ArrowUp, Camera, ChevronRight, ImageIcon, Plus, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { saveEstimate, uploadEstimatePhoto } from "@/app/actions/estimates";
import { depositFor, paymentRows, totalOf } from "@/lib/estimate-math";
import { ESTIMATE_TEMPLATES, templateJob, type EstimateJob, type EstimateStage, type EstimateStep } from "@/lib/estimate-templates";
import { money } from "@/lib/format";
import { shrinkImage } from "@/lib/shrink";

export type EditorValue = {
  id?: string;
  leadId: string;
  customer: { name: string; email: string; phone: string; address: string };
  title: string;
  note: string;
  jobs: EstimateJob[];
  exclusions: string[];
  schedule: EstimateStage[];
  validDays: number;
};

const field = "w-full rounded-lg border border-border bg-card px-3 py-2 text-base sm:text-sm outline-none focus:border-gold";
const label = "mb-1 block text-xs font-medium text-muted";
const STEPS = ["Customer", "Work & price", "Payments"];
const blankStep = (): EstimateStep => ({ title: "", items: [], photos: [] });
export const photoSrc = (id: string) => `/estimates/photo/${id}`;

/** Build or edit an estimate in 3 steps: customer → work (jobs with one price each; their steps open big, with photos) → payments. */
export function EstimateEditor({ initial, suggested }: { initial: EditorValue; suggested?: string }) {
  const [v, setV] = useState(initial);
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState<{ job: number; step: number } | null>(null);
  const [msg, action, pending] = useActionState(saveEstimate, null);
  const set = <K extends keyof EditorValue>(k: K, val: EditorValue[K]) => setV((x) => ({ ...x, [k]: val }));
  const setJob = (ji: number, patch: Partial<EstimateJob>) => setV((x) => ({ ...x, jobs: x.jobs.map((j, k) => (k === ji ? { ...j, ...patch } : j)) }));
  const setStepAt = (ji: number, si: number, patch: Partial<EstimateStep>) => setV((x) => ({ ...x, jobs: x.jobs.map((j, k) => (k === ji ? { ...j, steps: j.steps.map((st, m) => (m === si ? { ...st, ...patch } : st)) } : j)) }));
  const moveStep = (ji: number, si: number, d: number) => {
    const xs = [...v.jobs[ji]!.steps];
    const [it] = xs.splice(si, 1);
    xs.splice(si + d, 0, it!);
    setJob(ji, { steps: xs });
    setOpen({ job: ji, step: si + d });
  };
  const removeStep = (ji: number, si: number) => {
    const st = v.jobs[ji]!.steps[si]!;
    if (!confirm(`Remove step ${si + 1}${st.title ? ` (${st.title})` : ""}?`)) return;
    setJob(ji, { steps: v.jobs[ji]!.steps.filter((_, m) => m !== si) });
    setOpen(null);
  };
  const addStep = (ji: number) => {
    setJob(ji, { steps: [...v.jobs[ji]!.steps, blankStep()] });
    setOpen({ job: ji, step: v.jobs[ji]!.steps.length });
  };
  const addJob = (key: string) => {
    const t = ESTIMATE_TEMPLATES.find((x) => x.key === key);
    set("jobs", [...v.jobs, t && key !== "blank" ? templateJob(t, t.label) : { title: "", price: 0, steps: [blankStep()] }]);
  };
  const removeJob = (ji: number) => {
    if (!confirm(`Remove ${v.jobs[ji]!.title || `job ${ji + 1}`} with all its steps?`)) return;
    set("jobs", v.jobs.filter((_, k) => k !== ji));
  };
  const total = totalOf(v.jobs);
  const pct = v.schedule.reduce((a, s) => a + (Number(s.pct) || 0), 0);
  const applyTemplate = (key: string) => {
    const t = ESTIMATE_TEMPLATES.find((x) => x.key === key);
    if (!t) return;
    const touched = v.jobs.some((j) => j.price || j.steps.some((st) => st.items.length || st.photos?.length));
    if (touched && !confirm("Replace the work with this template?")) return;
    setV((x) => ({ ...x, title: t.title || x.title, jobs: [templateJob(t)], exclusions: [...t.exclusions], schedule: t.schedule.map((s) => ({ ...s })) }));
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
        <section className="space-y-4">
          <p className="px-1 text-xs text-muted">Each job has one price. Its steps describe the work — tap a step to open it big and add photos.</p>
          {v.jobs.map((j, ji) => (
            <div key={ji} className="rounded-2xl border border-border bg-card p-3">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted">Job {ji + 1}</span>
                <input className={`${field} font-semibold`} value={j.title} placeholder="Job name (e.g. Pavers)" onChange={(e) => setJob(ji, { title: e.target.value })} />
                {v.jobs.length > 1 && <button type="button" onClick={() => removeJob(ji)} className="shrink-0 p-1.5 text-bad" aria-label="Remove job"><Trash2 className="size-4" /></button>}
              </div>
              <div className="mt-3 space-y-2">
                {j.steps.map((st, si) => (
                  <button key={si} type="button" onClick={() => setOpen({ job: ji, step: si })} className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left hover:border-gold">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold-soft text-xs font-bold text-gold-text">{si + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{st.title || <span className="text-muted">Step {si + 1} — tap to write</span>}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                        {st.items.filter((x) => x.trim()).length} lines
                        {!!st.photos?.length && <><ImageIcon className="size-3.5" /> {st.photos.length}</>}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted" />
                  </button>
                ))}
                <button type="button" onClick={() => addStep(ji)} className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-gold-text"><Plus className="size-4" /> Add step</button>
              </div>
              <label className="mt-3 flex items-center gap-3 border-t border-border pt-3">
                <span className="shrink-0 text-sm font-semibold">Price{j.title ? ` — ${j.title}` : ""}</span>
                <span className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted">$</span>
                  <input className={`w-full rounded-xl border bg-card py-2.5 pl-7 pr-3 text-right text-xl font-semibold tabular-nums outline-none focus:border-gold ${j.price ? "border-border" : "border-bad/60"}`} inputMode="numeric" placeholder="0" value={j.price ? j.price.toLocaleString("en-US") : ""} onChange={(e) => setJob(ji, { price: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })} />
                </span>
              </label>
            </div>
          ))}
          <label className="block rounded-2xl border border-dashed border-border p-3">
            <span className="flex items-center gap-1 text-sm font-medium text-gold-text"><Plus className="size-4" /> Add another job — with its own price</span>
            <select className={`${field} mt-2`} value="" onChange={(e) => e.target.value && addJob(e.target.value)}>
              <option value="">Choose… (e.g. Fence)</option>
              {ESTIMATE_TEMPLATES.map((t) => <option key={t.key} value={t.key}>{t.key === "blank" ? "Blank job" : t.label}</option>)}
            </select>
          </label>
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

      {open && v.jobs[open.job]?.steps[open.step] && (
        <ItemSheet
          key={`${open.job}-${open.step}`}
          n={open.step}
          count={v.jobs[open.job]!.steps.length}
          job={v.jobs[open.job]!.title}
          value={v.jobs[open.job]!.steps[open.step]!}
          onChange={(patch) => setStepAt(open.job, open.step, patch)}
          onClose={() => setOpen(null)}
          onMove={(d) => moveStep(open.job, open.step, d)}
          onRemove={() => removeStep(open.job, open.step)}
        />
      )}
    </form>
  );
}

/** One step of a job, full screen: big title and lines, and its photos (the price is on the job). */
function ItemSheet({ n, count, job, value: s, onChange, onClose, onMove, onRemove }: {
  n: number; count: number; job: string; value: EstimateStep;
  onChange: (p: Partial<EstimateStep>) => void; onClose: () => void; onMove: (d: number) => void; onRemove: () => void;
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
    <div className="fixed inset-0 z-50 flex flex-col bg-bg" role="dialog" aria-label={`Step ${n + 1}`}>
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="grid size-8 place-items-center rounded-full bg-gold-soft text-sm font-bold text-gold-text">{n + 1}</span>
        <span className="min-w-0 flex-1 truncate text-sm text-muted">{job ? `${job} · ` : ""}Step {n + 1} of {count}</span>
        <button type="button" onClick={onClose} className="gold-gradient rounded-xl px-4 py-2 text-sm font-bold text-black">Done</button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 p-4 pb-10">
          <input className="w-full border-b border-border bg-transparent pb-2 text-2xl font-bold outline-none focus:border-gold" value={s.title} placeholder="Step name (e.g. Demolition)" onChange={(e) => onChange({ title: e.target.value })} />

          <label className="block">
            <span className={label}>What&apos;s included — one line each (the customer sees each line as a bullet)</span>
            <textarea className="min-h-56 w-full rounded-xl border border-border bg-card p-3 text-lg leading-relaxed outline-none focus:border-gold" rows={Math.max(7, text.split("\n").length + 2)} value={text} onChange={(e) => writeLines(e.target.value)} placeholder={"Remove the existing tub and tile\nHaul away all debris"} />
          </label>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Photos <span className="font-normal text-muted">— the customer sees them under this step</span></span>
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
            <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-bad"><Trash2 className="size-4" /> Remove step</button>
          </div>
        </div>
      </div>
    </div>
  );
}
