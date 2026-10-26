import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { ContractDocument } from "@/components/contract-document";
import { PrintButton } from "@/components/print-button";
import { SignContract } from "@/components/sign-contract";
import { contractByToken, payInstructions } from "@/lib/contracts";
import { loggedInUser } from "@/lib/data";
import { sql } from "@/lib/db";
import { money } from "@/lib/format";
import { pushToTeam } from "@/lib/push";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your contract — MD Golden Builders" };
// Link previews (iMessage, WhatsApp, Facebook…) fetch the page too — that isn't the customer.
const BOT = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|skype|embedly|quora|pinterest|vkshare|google-read-aloud|headless/i;

/** What the customer opens from the text / email: review and sign; afterwards, their signed copy. */
export default async function CustomerContractPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const c = await contractByToken(token);
  if (!c || !c.contractor) notFound();
  const ua = (await headers()).get("user-agent") ?? "";
  if (c.status === "Sent" && !BOT.test(ua) && !(await loggedInUser())) {
    const [first] = await sql()`update contracts set status = 'Viewed', viewed_at = now() where id = ${c.id} and status = 'Sent' returning id`;
    if (first) after(() => pushToTeam({ title: `👀 ${c.data.owner.name} opened contract #${c.number}`, body: `${c.data.title} · ${money(c.data.price)}`, url: `/contracts/${c.id}` }).catch((e) => console.error("open notice failed", e)));
  }
  const firstName = c.data.owner.name.split(" ")[0] ?? "";
  const signed = c.status === "Signed";
  const pay = signed ? await payInstructions() : ""; // only on the customer's own signed copy (private link)
  return (
    <div className="space-y-4 px-2 py-4 sm:px-4 print:space-y-0 print:p-0">
      <div className="mx-auto max-w-[820px] border border-[#e3ddd0] bg-white p-5 text-[#1c1c1c] sm:p-8 print:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-light.png" alt="MD Golden Builders" className="h-12 w-auto" />
        {signed ? (
          <>
            <h1 className="font-letter mt-4 text-2xl font-bold">Signed ✓ — thank you, {firstName}!</h1>
            <p className="mt-1 text-sm text-[#555]">This is your completely filled-in, signed copy (all 6 pages). Save it as a PDF for your records.</p>
            <div className="mt-3"><PrintButton /></div>
            <div className="mt-5 border-t border-[#e3ddd0] pt-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8a6a1f]">Next step</div>
              <div className="font-letter mt-1 text-lg font-bold">Down payment — {money(c.data.downPayment)}</div>
              {pay ? <p className="mt-1 whitespace-pre-line text-sm">{pay}</p> : <p className="mt-1 text-sm">Meidan will send you the payment details.</p>}
              <p className="mt-1 text-xs text-[#666]">Please write &quot;Contract {c.number}&quot; in the memo. Each progress payment is due only after that part of the work is done.</p>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-letter mt-4 text-2xl font-bold">Hi {firstName}, your contract is ready</h1>
            <p className="mt-1 text-sm text-[#555]">{c.data.title} · {money(c.data.price)}. Meidan already signed it and everything is filled in. Go through the 6 pages with Back / Next — the gold spots show where your signature goes — then sign once at the bottom.</p>
            <a href="#sign" className="mt-3 inline-block bg-[#1c1c1c] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-white">Skip to signing</a>
          </>
        )}
      </div>
      <ContractDocument number={c.number} d={c.data} contractor={c.contractor} owner={c.owner} todo={!signed} />
      {!signed && <SignContract token={token} ownerName={c.data.owner.name} age65={!!c.data.age65} />}
    </div>
  );
}
