import { CheckCircle2, Circle, Download, ExternalLink, Eye, FileSignature, Pencil } from "lucide-react";
import { DeleteDraftEstimate, DuplicateEstimate } from "@/components/estimate-actions";
import { generateContract } from "@/app/actions/contracts";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { FormalEstimate } from "@/components/formal-estimate";
import { SendEstimate } from "@/components/send-estimate";
import { BackLink, Button, Card, CardHeader } from "@/components/ui";
import { canSeeAll, currentUser, getLead } from "@/lib/data";
import { emailReady } from "@/lib/email";
import { estimateDoc } from "@/lib/estimate-doc";
import { contractOfEstimate } from "@/lib/contracts";
import { estimateById } from "@/lib/estimates";
import { dateLong, dateTime } from "@/lib/format";

/** Staff view of one estimate: where it stands, send it, and exactly what the customer sees. */
export default async function EstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const e = user.role === "pm" ? null : await estimateById(id);
  const lead = e?.leadId ? await getLead(e.leadId) : null;
  if (!e || (e.leadId ? !lead : !canSeeAll(user))) notFound();
  const contract = e.status === "Approved" ? await contractOfEstimate(e.id) : null;
  const h = await headers();
  const link = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}/e/${e.token}`;
  const first = e.customer.name.split(" ")[0];
  const steps = [
    ["Created", e.createdAt],
    ["Sent", e.sentAt],
    [e.openCount > 1 ? `Opened by the customer · ${e.openCount} times, last ${dateTime(e.lastOpenedAt!)}` : "Opened by the customer", e.viewedAt],
    [e.approvedName ? `Approved by ${e.approvedName}` : "Approved", e.approvedAt],
  ] as const;

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href={lead ? `/leads/${lead.id}` : "/estimates"} label={lead?.name ?? "Estimates"} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Estimate #{e.number}</h1>
        <div className="flex flex-wrap gap-2">
          {e.status !== "Approved" && <Button href={`/estimates/${e.id}/edit`}><Pencil className="size-4" /> Edit</Button>}
          <a href={`/estimates/${e.id}/pdf`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-surface"><Eye className="size-4" /> Preview PDF</a>
          <a href={`/estimates/${e.id}/pdf?download=1`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-surface"><Download className="size-4" /> Download PDF</a>
          <DuplicateEstimate id={e.id} />
          {e.status !== "Draft" && <Button href={`/e/${e.token}`}><ExternalLink className="size-4" /> Customer view</Button>}
          {e.status === "Draft" && !e.sentAt && <DeleteDraftEstimate id={e.id} number={e.number} />}
        </div>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title="Status" />
          <ul className="space-y-2 p-4 text-sm">
            {steps.map(([label, at]) => (
              <li key={label} className="flex items-center gap-2">
                {at ? <CheckCircle2 className="size-4 text-ok" /> : <Circle className="size-4 text-muted" />}
                <span className={at ? "" : "text-muted"}>{label}</span>
                {at && <span className="ml-auto text-xs text-muted">{dateTime(at)}</span>}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title={e.status === "Approved" ? "Approved ✓" : e.sentAt ? "Send again" : "Send to the customer"} subtitle={e.status === "Approved" ? "Next: the contract" : "Their own private link"} />
          <div className="p-4">
            {e.status === "Approved" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">{e.approvedName} approved this on {dateLong(e.approvedAt)}.</p>
                {contract ? (
                  <Button href={`/contracts/${contract.id}`} variant="primary"><FileSignature className="size-4" /> Contract #{contract.number} — {contract.status === "Signed" ? "signed ✓" : contract.contractor ? "waiting for the customer" : "fill & sign"}</Button>
                ) : (
                  <form action={generateContract.bind(null, e.id)}>
                    <button className="gold-gradient inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-black"><FileSignature className="size-4" /> Generate contract</button>
                    <p className="mt-1.5 text-xs text-muted">Form 203 + Additional Description, filled from this estimate: customer, scope, price and payments.</p>
                  </form>
                )}
              </div>
            ) : (
              <SendEstimate id={e.id} link={link} phone={e.customer.phone} email={e.customer.email} first={first} title={e.title} emailOn={emailReady()} />
            )}
          </div>
        </Card>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-[#f4f1ea] text-text" data-theme="light">
        <div className="border-b border-border bg-card px-4 py-2 text-xs font-semibold text-muted">Preview — exactly what the customer sees (the PDF has the same content)</div>
        <FormalEstimate
          {...estimateDoc(e)}
          photoSrc={(p) => `/estimates/photo/${p}`}
          acceptance={<div className="mt-4 border-t border-dashed border-[#b8902f] pt-3 text-center text-xs text-[#777]">The customer types their name and approves here.</div>}
        />
      </div>
    </div>
  );
}
