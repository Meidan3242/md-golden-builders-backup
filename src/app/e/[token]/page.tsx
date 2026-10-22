import { CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { ApproveEstimate } from "@/components/approve-estimate";
import { CustomerDoc } from "@/components/customer-doc";
import { sql } from "@/lib/db";
import { paymentRows } from "@/lib/estimate-math";
import { estimateByToken } from "@/lib/estimates";
import { dateLong } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your estimate — MD Golden Builders" };

/** What the customer opens from the text / email. Only this one estimate, only by its private link. */
export default async function CustomerEstimatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const e = await estimateByToken(token);
  if (!e) notFound();
  // First time the customer opens it: let the team know.
  if (e.status === "Sent") {
    await sql()`update estimates set status = 'Viewed', viewed_at = now() where id = ${e.id} and status = 'Sent'`;
    if (e.leadId) await sql()`update leads set estimate_viewed_at = coalesce(estimate_viewed_at, now()) where id = ${e.leadId}`;
  }
  const first = e.customer.name.split(" ")[0];
  const validUntil = new Date(new Date(e.sentAt ?? e.createdAt).getTime() + e.validDays * 86_400_000).toISOString();
  return (
    <CustomerDoc
      kind="Estimate"
      number={e.number}
      date={dateLong(e.sentAt ?? e.createdAt)}
      subline={`Valid until ${dateLong(validUntil)}`}
      customer={{ name: e.customer.name, first, address: e.customer.address }}
      title={e.title}
      note={e.note}
      sections={e.sections}
      exclusions={e.exclusions}
      total={e.total}
      schedule={[]}
      rows={paymentRows(e.total, e.schedule)}
      withDeposit
      warranty="Workmanship warranty in writing"
      action={
        e.status === "Approved" ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-ok-soft p-3 text-sm text-ok">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div><b>Approved by {e.approvedName}</b> on {dateLong(e.approvedAt)}. Thank you! I&apos;ll send the contract next.</div>
          </div>
        ) : (
          <ApproveEstimate token={token} first={first} />
        )
      }
    />
  );
}
