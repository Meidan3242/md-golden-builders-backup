"use client";

import { Copy, Mail, MessageSquare, PenLine } from "lucide-react";
import { useState } from "react";
import { contractSent, emailContract, saveContractDetails, savePayInstructions, signAsContractor } from "@/app/actions/contracts";
import type { ContractData } from "@/lib/contract-form";

const field = "w-full rounded-lg border border-border bg-card px-3 py-2 text-base sm:text-sm outline-none focus:border-gold disabled:opacity-60";
const label = "mb-1 block text-xs font-medium text-muted";
const note = (m?: string) => m && <p className={`mt-2 text-sm ${m.startsWith("Failed") ? "text-bad" : "text-ok"}`}>{m}</p>;

// A plain busy flag (not a transition). When a step changes (signed, sent…) the page reloads to show the next step:
// a soft refresh after two actions in a row kept showing the old step.
function useBusy() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>();
  const run = (f: () => Promise<string>, reloadWhen: (r: string) => boolean = () => false) => {
    setBusy(true);
    setMsg(undefined);
    f()
      .then((r) => {
        setMsg(r);
        if (!r.startsWith("Failed") && reloadWhen(r)) window.location.reload();
      }, (e) => setMsg(`Failed: ${(e as Error).message}`))
      .finally(() => setBusy(false));
  };
  return { busy, msg, setMsg, run };
}

/** Step 1: the details only Meidan knows (dates), and anything to fix from the estimate. */
export function ContractDetails({ id, d, locked }: { id: string; d: ContractData; locked: boolean }) {
  const [f, setF] = useState({
    ownerName: d.owner.name, ownerStreet: d.owner.street, ownerCity: d.owner.cityStateZip, ownerPhone: d.owner.phone, ownerEmail: d.owner.email,
    workAddress: d.workAddress, lender: d.lender, commencement: d.commencement, startDate: d.startDate, completionDate: d.completionDate, allowances: d.allowances,
    age65: d.age65 ? "yes" : "no", arbitration: d.arbitration ? "yes" : "no",
  });
  const { busy, msg, run } = useBusy();
  const inp = (k: keyof typeof f, l: string, ph = "", wide = false) => (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className={label}>{l}</span>
      <input className={field} value={f[k]} placeholder={ph} disabled={locked} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
    </label>
  );
  return (
    <form onSubmit={(e) => { e.preventDefault(); run(() => saveContractDetails(id, f), (r) => r.includes("sign again")); }} className="grid gap-3 p-4 sm:grid-cols-2">
      {inp("startDate", "Approximate start date *", "e.g. Nov 16, 2026 or 2 weeks after permit")}
      {inp("completionDate", "Approximate completion date *", "e.g. Jan 15, 2027")}
      {inp("commencement", "What counts as the start of the work *", "", true)}
      {inp("ownerName", "Owner name(s) — as on the contract")}
      {inp("ownerPhone", "Owner phone")}
      {inp("ownerStreet", "Owner mailing address")}
      {inp("ownerCity", "City, State & Zip")}
      {inp("ownerEmail", "Owner email")}
      {inp("workAddress", "Work to be performed at")}
      {inp("lender", "Construction lender", "None")}
      {inp("allowances", "Allowances", "None")}
      <label>
        <span className={label}>Owner 65 or older?</span>
        <select className={field} value={f.age65} disabled={locked} onChange={(e) => setF({ ...f, age65: e.target.value })}>
          <option value="no">No — 3-day right to cancel</option>
          <option value="yes">Yes — 5-day right to cancel</option>
        </select>
      </label>
      <label>
        <span className={label}>Arbitration of disputes (the owner&apos;s choice)</span>
        <select className={field} value={f.arbitration} disabled={locked} onChange={(e) => setF({ ...f, arbitration: e.target.value })}>
          <option value="no">Not included</option>
          <option value="yes">Owner agreed — they initial it too</option>
        </select>
      </label>
      {!locked && (
        <div className="sm:col-span-2">
          <button disabled={busy} className="gold-gradient rounded-xl px-5 py-2.5 text-sm font-bold text-black disabled:opacity-60">{busy ? "Saving…" : "Save details"}</button>
          {note(msg)}
        </div>
      )}
    </form>
  );
}

/** Step 2: Meidan's signature (typed). */
export function ContractorSignBox({ id, defaultName }: { id: string; defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [agree, setAgree] = useState(false);
  const { busy, msg, run } = useBusy();
  return (
    <div className="space-y-3 p-4">
      <label className="block">
        <span className={label}>Your full name — this is your signature</span>
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="flex items-start gap-2 text-xs text-muted">
        <input type="checkbox" className="mt-0.5 size-4 accent-[#d4a73a]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        I reviewed the contract below and sign it electronically for MD Golden Builders. My typed name is my signature.
      </label>
      <button type="button" disabled={busy} onClick={() => run(() => signAsContractor(id, name, agree), () => true)} className="gold-gradient inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-black disabled:opacity-60">
        <PenLine className="size-4" /> {busy ? "Signing…" : "Sign the contract"}
      </button>
      {note(msg)}
    </div>
  );
}

/** Step 3: send the signing link. */
export function SendContract({ id, link, phone, email, first, emailOn }: { id: string; link: string; phone: string; email: string; first: string; emailOn: boolean }) {
  const [text, setText] = useState(`Hi ${first}, it's Meidan from MD Golden Builders. Your contract is ready — I already signed it. Please review and sign here: ${link}\nAny question, just text me.`);
  const { busy, msg, setMsg, run } = useBusy();
  const digits = phone.replace(/[^0-9+]/g, "");
  const btn = "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold disabled:opacity-60";
  return (
    <div className="space-y-2 p-4">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || !emailOn || !email} className={`${btn} ${emailOn ? "gold-gradient text-black" : "border border-border bg-card"}`} onClick={() => run(() => emailContract(id))} title={!emailOn ? "Email isn't connected yet" : !email ? "No email on the contract" : ""}>
          <Mail className="size-4" /> Email with payment info
        </button>
        <button type="button" disabled={busy} className={`${btn} border border-border bg-card`} onClick={() => {
          const sep = /iPhone|iPad|Macintosh/.test(navigator.userAgent) ? "&" : "?"; // iPhone wants "&body=", Android "?body="
          window.location.href = `sms:${digits}${sep}body=${encodeURIComponent(text)}`;
          run(() => contractSent(id));
        }}><MessageSquare className="size-4" /> Text it</button>
        <button type="button" disabled={busy} className={`${btn} border border-border bg-card`} onClick={() => {
          // Copy in the tap itself (phones require that); marking it sent doesn't wait for the copy.
          const copied = navigator.clipboard?.writeText(text).then(() => true, () => false) ?? Promise.resolve(false);
          run(async () => {
            const r = await contractSent(id);
            const ok = await Promise.race([copied, new Promise<boolean>((done) => setTimeout(() => done(false), 1500))]);
            return r.startsWith("Failed") ? r : ok ? "Copied ✓ — paste it in any chat" : "Marked as sent — long-press the message above to copy it";
          });
        }}><Copy className="size-4" /> Copy</button>

      </div>
      {!emailOn && <p className="text-[11px] text-muted">Email: not connected yet — Text and Copy work now.</p>}
      {msg && <p className={`text-sm ${msg.startsWith("Failed") ? "text-bad" : "text-ok"}`} onClick={() => setMsg(undefined)}>{msg}</p>}
    </div>
  );
}

/** How customers pay the deposit — written once, goes into every contract email and the customer's signed copy. */
export function PayInstructions({ initial }: { initial: string }) {
  const [text, setText] = useState(initial);
  const { busy, msg, run } = useBusy();
  return (
    <div className="space-y-2 p-4">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder={"e.g. Zelle to info@mdgoldenbuilders.com (MD Golden Builders)\nor a check payable to MD Golden Builders"} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-base sm:text-sm" />
      <button type="button" disabled={busy} onClick={() => run(() => savePayInstructions(text))} className="rounded-xl border border-gold px-4 py-2 text-sm font-semibold text-gold-text disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
      {note(msg)}
    </div>
  );
}
