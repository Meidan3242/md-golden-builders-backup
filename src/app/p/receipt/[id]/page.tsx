import { MailFrame, Signature } from "@/components/mail-frame";
import { money } from "@/lib/format";

export const metadata = { title: "Payment receipt email" };

// Rachel Donovan, contract #1 — the footings payment (demo)
const R = { amount: 33904, method: "check #2207", date: "Sep 24", step: "installation of the footings", total: 85760, paidSoFar: 68808, next: { name: "stucco installation", amount: 8476 } };

/** Sent automatically when a payment is marked as received — a short thank-you with the receipt attached. */
export default function ReceiptEmail() {
  return (
    <div className="min-h-screen bg-[#f2f2f7] sm:py-2">
      <MailFrame
        from="Laline — MD Golden Builders"
        fromEmail="CRM@mdgoldenbuilders.com"
        to="Rachel Donovan"
        when={`${R.date}, 3:18 PM`}
        subject="Got your payment — thank you, Rachel!"
        pdfs={[{ name: "Receipt R-2026-031-03 - Donovan.pdf", size: "PDF · 1 page" }]}
      >
        <p>Hi Rachel,</p>
        <p>
          Just letting you know we received your payment of <b>{money(R.amount)}</b> ({R.method}) for the {R.step} — thank you so much!
          Your receipt is attached.
        </p>
        <p>
          So far you&apos;ve paid {money(R.paidSoFar)} of {money(R.total)}, which leaves {money(R.total - R.paidSoFar)}. The next step is the{" "}
          {R.next.name} ({money(R.next.amount)}) — I&apos;ll let you know when we get there.
        </p>
        <p>The wall is looking great. Have a wonderful evening!</p>
        <p className="mb-0">
          Best,
          <br />
          Laline
        </p>
        <Signature />
      </MailFrame>
    </div>
  );
}
