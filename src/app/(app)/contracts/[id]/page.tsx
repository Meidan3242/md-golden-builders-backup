import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ContractDocument } from "@/components/contract-document";
import { ContractDetails, ContractorSignBox, PayInstructions, SendContract } from "@/components/contract-setup";
import { BackLink, Button, Card, CardHeader } from "@/components/ui";
import { canSeeAll, currentUser, getLead } from "@/lib/data";
import { contractById, payInstructions } from "@/lib/contracts";
import { emailReady } from "@/lib/email";
import { dateTime } from "@/lib/format";

/** Staff view of one contract: fill the dates, Meidan signs, send the link, watch it get signed. */
export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const c = user.role === "pm" ? null : await contractById(id);
  const lead = c?.leadId ? await getLead(c.leadId) : null;
  if (!c || (c.leadId ? !lead : !canSeeAll(user))) notFound();
  const h = await headers();
  const link = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}/c/${c.token}`;
  const signed = c.status === "Signed";
  const pay = await payInstructions();
  const steps = [
    ["Prepared from estimate #" + c.data.estimateNumber, c.createdAt],
    [c.contractor ? `Signed by ${c.contractor.name}` : "Signed by you", c.contractor?.at],
    ["Sent to the customer", c.sentAt],
    ["Opened by the customer", c.viewedAt],
    [c.owner ? `Signed by ${c.owner.name}` : "Signed by the customer", c.signedAt],
  ] as const;

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href={c.estimateId ? `/estimates/${c.estimateId}` : "/leads"} label={`Estimate #${c.data.estimateNumber}`} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Contract #{c.number}{lead ? ` — ${lead.name}` : ""}</h1>
        {c.contractor && <Button href={`/c/${c.token}`}><ExternalLink className="size-4" /> {signed ? "Signed copy / PDF" : "Customer view"}</Button>}
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title="Status" />
          <ul className="space-y-2 p-4 text-sm">
            {steps.map(([l, at]) => (
              <li key={l} className="flex items-center gap-2">
                {at ? <CheckCircle2 className="size-4 text-ok" /> : <Circle className="size-4 text-muted" />}
                <span className={at ? "" : "text-muted"}>{l}</span>
                {at && <span className="ml-auto text-xs text-muted">{dateTime(at)}</span>}
              </li>
            ))}
          </ul>
          {signed && c.owner && (
            <p className="border-t border-border px-4 py-3 text-xs text-muted">
              Right to cancel until midnight {new Date(c.owner.cancelBy).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric" })} ({c.owner.age65 ? "5" : "3"} business days) — don&apos;t start work before then. Arbitration: {c.owner.arbitration ? "agreed" : "not agreed"}.
            </p>
          )}
        </Card>
        <Card>
          {!c.contractor ? (
            user.role === "admin" ? (
              <>
                <CardHeader title="2. Sign" subtitle="Fill the dates first (1), then sign. The customer signs after you." />
                <ContractorSignBox id={c.id} defaultName={user.name} />
              </>
            ) : (
              <CardHeader title="Waiting for Meidan to sign" subtitle="He signs first, then it can be sent to the customer." />
            )
          ) : signed ? (
            <CardHeader title="Signed by both ✓" subtitle="Next: collect the down payment and start the project after the cancel period." />
          ) : (
            <>
              <CardHeader title={c.sentAt ? "3. Send again" : "3. Send to the customer"} subtitle="Their own private link — they review and sign on the phone" />
              <SendContract id={c.id} link={link} phone={c.data.owner.phone} email={c.data.owner.email} first={c.data.owner.name.split(" ")[0] ?? ""} emailOn={emailReady()} />
            </>
          )}
        </Card>
      </div>

      {!signed && (
        <Card className="mb-4">
          <CardHeader title="How the customer pays the deposit" subtitle={pay ? "Goes into the contract email and the customer's signed copy. Saved for every contract." : "Write it once — the contract email explains how to pay the deposit."} />
          <PayInstructions initial={pay} />
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader title="1. Contract details" subtitle={signed ? "Signed — can't be changed" : "Scope, price and payments come from the approved estimate. Changing a detail after you signed asks you to sign again."} />
        <ContractDetails id={c.id} d={c.data} locked={signed} />
      </Card>

      <div className="overflow-hidden rounded-2xl border border-border bg-[#f4f1ea] text-text" data-theme="light">
        <div className="border-b border-border bg-card px-4 py-2 text-xs font-semibold text-muted">The contract — {signed ? "signed copy" : "what the customer signs (gold = their spots)"}</div>
        <div className="p-2 sm:p-4">
          <ContractDocument number={c.number} d={c.data} contractor={c.contractor} owner={c.owner} todo={!signed} />
        </div>
      </div>
    </div>
  );
}
