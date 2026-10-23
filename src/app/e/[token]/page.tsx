import { notFound } from "next/navigation";
import { ApproveEstimate } from "@/components/approve-estimate";
import { FormalEstimate } from "@/components/formal-estimate";
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
  const issued = e.sentAt ?? e.createdAt;
  return (
    <FormalEstimate
      number={e.number}
      date={dateLong(issued)}
      validUntil={dateLong(new Date(new Date(issued).getTime() + e.validDays * 86_400_000).toISOString())}
      customer={e.customer}
      title={e.title}
      note={e.note}
      sections={e.sections}
      exclusions={e.exclusions}
      total={e.total}
      rows={paymentRows(e.total, e.schedule)}
      printable
      acceptance={
        e.status === "Approved" ? (
          <div className="mt-4 border-t border-[#d8d2c4] pt-3 text-sm">
            <div className="font-letter text-xl">{e.approvedName}</div>
            <div className="text-[#555]">Approved on {dateLong(e.approvedAt)} — thank you. The contract will be sent to you next.</div>
          </div>
        ) : (
          <ApproveEstimate token={token} first={first} />
        )
      }
    />
  );
}
