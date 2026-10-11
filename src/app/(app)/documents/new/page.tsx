import clsx from "clsx";
import { AlertTriangle, CheckCircle2, FilePlus2, FileSignature, FileText, HardHat, Mic, PenLine, Plus, ScrollText, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge, Button, Card, CardHeader, PageHeader } from "@/components/ui";
import { DEMO_ESTIMATE as E } from "@/lib/demo-docs";
import { money } from "@/lib/format";

const TYPES = [
  { key: "estimate", icon: FileText, title: "Estimate", desc: "Scope + price. Customer approves, pays the deposit, then gets the contract.", who: "Customer" },
  { key: "contract", icon: FileSignature, title: "Contract", desc: "Form 203 + Additional Description, pre-signed by you. From an estimate or from scratch.", who: "Customer" },
  { key: "change-order", icon: FilePlus2, title: "Change Order", desc: "Extra work on a signed project — own price, payments, subs.", who: "Customer" },
  { key: "additional", icon: ScrollText, title: "Additional Description", desc: "Scope + payment pages only, to attach to an existing contract.", who: "Customer" },
  { key: "sub", icon: HardHat, title: "Subcontractor Agreement", desc: "Scope, price and payment stages for a sub. They sign; we pay them.", who: "Subcontractor" },
];

const input = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm";

function Source({ children }: { children: React.ReactNode }) {
  return <span className="ml-1.5 rounded bg-info-soft px-1 text-[10px] font-medium text-info">{children}</span>;
}

export default async function NewDocumentPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type: requested } = await searchParams;
  const type = TYPES.find((x) => x.key === requested)?.key ?? "contract";
  const t = TYPES.find((x) => x.key === type)!;
  const isSub = type === "sub";
  const total = isSub ? 31500 : E.base;
  const deposit = isSub || type === "change-order" ? 0 : 1000;
  const rest = total - deposit;
  const rows = isSub
    ? [["Start / demo", 0.3], ["Footings complete", 0.3], ["Wall complete", 0.3], ["Final", 0.1]]
    : E.schedule.filter((m) => m.pct !== null).map((m) => [m.name, m.pct] as [string, number]);

  return (
    <>
      <PageHeader title="Create a document" subtitle="Pick what to send. Everything already known about the customer and project is filled in for you." />

      <div className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {TYPES.map(({ key, icon: Icon, title, desc, who }) => (
          <Link key={key} href={`?type=${key}`} className={clsx("rounded-xl border p-3 transition", key === type ? "border-gold bg-gold-soft" : "border-border bg-card hover:border-gold")}>
            <div className="flex items-center justify-between">
              <Icon className="size-5 text-gold-text" />
              <Badge tone={who === "Subcontractor" ? "info" : "neutral"}>{who}</Badge>
            </div>
            <div className="mt-2 text-sm font-semibold">{title}</div>
            <div className="mt-0.5 text-xs text-muted">{desc}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title={`1 · ${isSub ? "Subcontractor & project" : "Customer & project"}`} subtitle="Pulled from the lead / project record — Laline or the lead robot entered it once" />
            <div className="grid gap-3 p-4 sm:grid-cols-2 text-sm">
              <label>
                <span className="mb-1 block text-xs text-muted">Project</span>
                <select className={input}><option>#2026-031 · Rachel Donovan · 7025 Neptune Pl (Retaining wall)</option><option>New customer…</option></select>
              </label>
              {type === "contract" || type === "additional" ? (
                <label>
                  <span className="mb-1 block text-xs text-muted">Start from</span>
                  <select className={input}><option>Estimate #{E.number} — {money(E.base)} (approved Oct 12)</option><option>Blank — write a new scope</option></select>
                </label>
              ) : isSub ? (
                <label>
                  <span className="mb-1 block text-xs text-muted">Subcontractor</span>
                  <select className={input}><option>CM Concrete & Masonry (Carlos) — Lic. C-8 #998812</option></select>
                </label>
              ) : (
                <label>
                  <span className="mb-1 block text-xs text-muted">Start from</span>
                  <select className={input}><option>Blank</option><option>Copy a past {t.title.toLowerCase()}…</option></select>
                </label>
              )}
              {(isSub
                ? [["Name", "Carlos M. — CM Concrete & Masonry", "sub profile"], ["Phone", "(619) 555-0141", "sub profile"], ["License / insurance", "C-8 #998812 · insured to Feb 7, 2027", "sub profile"], ["Job address", "7025 Neptune Pl, La Jolla", "project"]]
                : [["Owner name(s)", "Rachel Donovan", "lead"], ["Phone · email", "(858) 555-1851 · rachel.donovan@example.com", "lead"], ["Property address", "7025 Neptune Pl, La Jolla, CA 92037", "lead"], ["Owner 65 or older?", "No → 3-day right to cancel", "asked once"]]
              ).map(([k, v, src]) => (
                <div key={k}>
                  <span className="mb-1 block text-xs text-muted">{k}<Source>{src}</Source></span>
                  <div className={input}>{v}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="2 · Scope of work"
              subtitle={type === "contract" ? `Copied from Estimate #${E.number} — edit anything` : "Write it, or let the assistant draft it from your notes"}
              action={<span className="inline-flex items-center gap-1 text-xs font-medium text-gold-text"><Sparkles className="size-3.5" /> Draft from site-visit notes</span>}
            />
            <div className="space-y-3 p-4">
              {E.sections.slice(0, isSub ? 3 : 4).map((s, i) => (
                <div key={s.title} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between text-sm font-semibold"><span>{i + 1}. {s.title}</span><PenLine className="size-3.5 text-muted" /></div>
                  <ul className="mt-1 space-y-0.5 text-sm text-muted">{s.items.map((it) => <li key={it}>• {it}</li>)}</ul>
                </div>
              ))}
              <div className="flex gap-2">
                <Button><Plus className="size-4" /> Section</Button>
                <Button><Mic className="size-4" /> Dictate</Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={`3 · Price & ${isSub ? "what we pay the sub" : "payment schedule"}`} subtitle={isSub ? "No deposit and no payment links — we pay the sub" : "Each project is different — build the schedule for this job"} />
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                <span className="text-sm font-medium">{isSub ? "Sub contract amount" : "Contract price"}</span>
                <span className="text-xl font-bold">{money(total)}</span>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {deposit > 0 && (
                    <tr><td className="py-2">Down payment — upon signing</td><td className="py-2 text-right font-semibold">{money(deposit)}</td><td className="w-28 py-2 text-right text-xs text-ok">✓ within CA limit</td></tr>
                  )}
                  {rows.map(([name, pct]) => (
                    <tr key={name as string}><td className="py-2">{name}</td><td className="py-2 text-right font-semibold">{money(Math.round(rest * (pct as number)))}</td><td className="py-2 text-right text-xs text-muted">{Math.round((pct as number) * 100)}%</td></tr>
                  ))}
                  <tr><td className="py-2 font-bold">Total</td><td className="py-2 text-right font-bold">{money(total)}</td><td className="py-2 text-right text-xs text-ok"><CheckCircle2 className="mr-1 inline size-3.5" />adds up</td></tr>
                </tbody>
              </table>
              {!isSub && (
                <p className="mt-3 flex gap-1.5 text-xs text-muted"><AlertTriangle className="size-3.5 shrink-0 text-warn" /> Checks run automatically: deposit ≤ $1,000 / 10%, schedule adds up to the price, every payment tied to completed work.</p>
              )}
              <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" /> Financed project (Foundation Finance pays the balance at completion)</label>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="text-sm font-semibold">4 · Send</div>
            <div className="mt-3 space-y-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Email (from CRM@mdgoldenbuilders.com)</label>
              <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Text message (business line)</label>
              {type === "contract" && <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Sign it as MD Golden Builders before sending</label>}
            </div>
            <div className="mt-4 rounded-lg bg-surface p-3 text-xs text-muted">
              Button in the email: <b className="text-text">{type === "estimate" || type === "change-order" ? "Review " + t.title : "Review & Sign"}</b>
              <br />After signing: {isSub ? "copy to the sub + saved to the project" : type === "estimate" ? "choose how to pay the deposit → contract follows" : type === "contract" ? "signed PDF to everyone + welcome email" : "signed copy + payment schedule updated"}
            </div>
            <div className="mt-4 grid gap-2">
              <Button href={type === "estimate" ? "/p/estimate/demo" : type === "change-order" ? "/p/change-order/demo" : "/p/sign/demo"}>Preview as customer</Button>
              <Button variant="primary" className="justify-center"><Send className="size-4" /> Send {t.title}</Button>
            </div>
          </Card>

          <Card className="p-4 text-xs text-muted">
            <div className="mb-1 text-sm font-semibold text-text">How the details get here</div>
            <ol className="list-decimal space-y-1 pl-4">
              <li><b>Lead</b> — robot / Laline captures name, phone, email, address, service.</li>
              <li><b>Site visit</b> — your notes, photos, voice memo.</li>
              <li><b>Estimate</b> — scope + price (typed, dictated or AI-drafted from your notes).</li>
              <li><b>Contract</b> — one click from the estimate: same scope + schedule, Form 203 filled.</li>
              <li><b>Change orders &amp; sub agreements</b> — start from the project, nothing retyped.</li>
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
