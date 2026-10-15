"use client";

import { Camera, FileUp, Receipt } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { addExpense, uploadProjectFile } from "@/app/actions/files";
import { shrinkImage } from "@/lib/shrink";

const btn = "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium gold-gradient text-black shadow-sm disabled:opacity-60";
const note = (m?: string) => m && <p className={`mt-2 text-xs ${m.startsWith("Failed") || m.includes("didn't") ? "text-bad" : "text-ok"}`}>{m}</p>;

/** Photos & videos (or documents) straight from the phone. */
export function ProjectUpload({ projectId, documents }: { projectId: string; documents?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState("During");
  const [msg, setMsg] = useState<string>();
  const [pending, start] = useTransition();
  const send = (files: FileList | null) =>
    files?.length &&
    start(async () => {
      const list = [...files];
      const failed: string[] = [];
      for (const [i, f] of list.entries()) {
        setMsg(`Uploading ${i + 1} of ${list.length}…`);
        const form = new FormData();
        form.set("projectId", projectId);
        form.set("phase", phase);
        if (documents) form.set("asDocument", "1");
        form.set("file", await shrinkImage(f));
        const r = await uploadProjectFile(form);
        if (r.startsWith("Failed")) failed.push(r.replace(/^Failed: /, ""));
      }
      setMsg(failed.length ? `Failed: ${failed.join(" · ")}` : `Done ✓ ${list.length} uploaded`);
      if (input.current) input.current.value = "";
    });
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {!documents && (
          <select value={phase} onChange={(e) => setPhase(e.target.value)} className="rounded-lg border border-border bg-card px-2 py-2 text-sm">
            <option>Before</option>
            <option>During</option>
            <option>After</option>
          </select>
        )}
        <button type="button" disabled={pending} onClick={() => input.current?.click()} className={btn}>
          {documents ? <FileUp className="size-4" /> : <Camera className="size-4" />} {pending ? "Uploading…" : documents ? "Upload document" : "Upload"}
        </button>
        <input ref={input} type="file" multiple hidden accept={documents ? "application/pdf,image/*" : "image/*,video/*"} onChange={(e) => send(e.target.files)} />
      </div>
      {note(msg)}
    </div>
  );
}

/** New expense with a photo of the receipt. */
export function SnapReceipt({ projectId, contracts }: { projectId: string; contracts: { n: number; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string>();
  const [pending, start] = useTransition();
  if (!open)
    return (
      <span>
        <button type="button" onClick={() => (setOpen(true), setMsg(undefined))} className="inline-flex items-center gap-1 text-xs font-medium text-gold-text">
          <Camera className="size-3.5" /> Snap receipt
        </button>
        {note(msg)}
      </span>
    );
  const field = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm";
  return (
    <form
      className="w-full space-y-2 rounded-xl border border-gold/50 bg-gold-soft/30 p-3"
      action={(form) =>
        start(async () => {
          const f = form.get("file");
          if (f instanceof File && f.size) form.set("file", await shrinkImage(f));
          const r = await addExpense(form);
          setMsg(r);
          if (r.startsWith("Done")) setOpen(false);
        })
      }
    >
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex items-center gap-1.5 text-sm font-semibold"><Receipt className="size-4 text-gold-text" /> New expense</div>
      <label className="block text-xs text-muted">Receipt photo<input name="file" type="file" accept="image/*" capture="environment" className="mt-1 block w-full text-sm" /></label>
      <input name="vendor" required placeholder="Paid to (Home Depot, sub name…)" className={field} />
      <div className="grid grid-cols-2 gap-2">
        <input name="amount" required inputMode="decimal" placeholder="Amount $" className={field} />
        <select name="category" className={field}><option>Materials</option><option value="Other">Sub / other</option></select>
      </div>
      {contracts.length > 1 && <select name="contract" className={field}>{contracts.map((c) => <option key={c.n} value={c.n}>{c.label}</option>)}</select>}
      <div className="flex gap-2">
        <button disabled={pending} className={btn}>{pending ? "Saving…" : "Save expense"}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-border px-3 py-2 text-sm">Cancel</button>
      </div>
      {note(msg)}
    </form>
  );
}
