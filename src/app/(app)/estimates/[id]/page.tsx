import { CheckCircle2, Circle, ExternalLink, Pencil } from "lucide-react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { FormalEstimate } from "@/components/formal-estimate";
import { SendEstimate } from "@/components/send-estimate";
import { BackLink, Button, Card, CardHeader } from "@/components/ui";
import { canSeeAll, currentUser, getLead } from "@/lib/data";
import { emailReady } from "@/lib/email";
import { paymentRows } from "@/lib/estimate-math";
import { estimateById } from "@/lib/estimates";
import { dateLong, dateTime } from "@/lib/format";

/** Staff view of one estimate: where it stands, send it, and exactly what the customer sees. */
export default async function EstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const e = user.role === "pm" ? null : await estimateById(id);
  const lead = e?.leadId ? await getLead(e.leadId) : null;
  if (!e || (e.leadId ? !lead : !canSeeAll(user))) notFound();
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
      <BackLink href={lead ? `/leads/${lead.id}` : "/leads"} label={lead?.name ?? "Leads"} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Estimate #{e.number}</h1>
        <div className="flex gap-2">
          {e.status !== "Approved" && <Button href={`/estimates/${e.id}/edit`}><Pencil className="size-4" /> Edit</Button>}
          {e.status !== "Draft" && <Button href={`/e/${e.token}`}><ExternalLink className="size-4" /> Customer view</Button>}
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
              <p className="text-sm text-muted">{e.approvedName} approved this on {dateLong(e.approvedAt)}. The contract & e-signature come in the next step of the app.</p>
            ) : (
              <SendEstimate id={e.id} link={link} phone={e.customer.phone} email={e.customer.email} first={first} title={e.title} emailOn={emailReady()} />
            )}
          </div>
        </Card>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-[#f4f1ea] text-text" data-theme="light">
        <div className="border-b border-border bg-card px-4 py-2 text-xs font-semibold text-muted">What the customer sees</div>
        <FormalEstimate
          number={e.number}
          date={dateLong(e.sentAt ?? e.createdAt)}
          validUntil={dateLong(new Date(new Date(e.sentAt ?? e.createdAt).getTime() + e.validDays * 86_400_000).toISOString())}
          customer={e.customer}
          title={e.title}
          note={e.note}
          sections={e.sections}
          photoSrc={(p) => `/estimates/photo/${p}`}
          exclusions={e.exclusions}
          total={e.total}
          rows={paymentRows(e.total, e.schedule)}
          acceptance={<div className="mt-4 border-t border-dashed border-[#b8902f] pt-3 text-center text-xs text-[#777]">The customer types their name and approves here.</div>}
        />
      </div>
    </div>
  );
}
