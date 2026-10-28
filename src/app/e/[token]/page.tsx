import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { ApproveEstimate } from "@/components/approve-estimate";
import { FormalEstimate } from "@/components/formal-estimate";
import { sql } from "@/lib/db";
import { estimateDoc } from "@/lib/estimate-doc";
import { customerOpened } from "@/lib/estimate-notices";
import { estimateVersion } from "@/lib/doc-version";
import { estimateByToken } from "@/lib/estimates";
import { loggedInUser } from "@/lib/data";
import { dateLong } from "@/lib/format";

export const dynamic = "force-dynamic";
// Link previews (iMessage, WhatsApp, Facebook…) fetch the page too — that isn't the customer.
const BOT = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|skype|embedly|quora|pinterest|vkshare|google-read-aloud|headless/i;
export const metadata = { title: "Your estimate — MD Golden Builders" };

/** What the customer opens from the text / email. Only this one estimate, only by its private link. */
export default async function CustomerEstimatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const e = await estimateByToken(token);
  if (!e) notFound();
  // The customer opened it (not the team checking, not a link-preview robot): count it and tell the team.
  const ua = (await headers()).get("user-agent") ?? "";
  if (!BOT.test(ua) && !(await loggedInUser())) {
    if (e.status === "Sent") {
      await sql()`update estimates set status = 'Viewed', viewed_at = now() where id = ${e.id} and status = 'Sent'`;
      if (e.leadId) await sql()`update leads set estimate_viewed_at = coalesce(estimate_viewed_at, now()) where id = ${e.leadId}`;
    }
    after(() => customerOpened(e).catch((err) => console.error("open notice failed", err)));
  }
  const first = e.customer.name.split(" ")[0];
  return (
    <FormalEstimate
      {...estimateDoc(e)}
      photoSrc={(p) => `/e/${token}/photo/${p}`}
      pdfHref={`/e/${token}/pdf`}
      acceptance={
        e.status === "Approved" ? (
          <div className="mt-4 border-t border-[#d8d2c4] pt-3 text-sm">
            <div className="font-letter text-xl">{e.approvedName}</div>
            <div className="text-[#555]">Approved on {dateLong(e.approvedAt)} — thank you. The contract will be sent to you next.</div>
          </div>
        ) : (
          <ApproveEstimate token={token} first={first} version={estimateVersion(e)} />
        )
      }
    />
  );
}
