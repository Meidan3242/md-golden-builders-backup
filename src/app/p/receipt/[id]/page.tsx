import { CheckCircle2, Star } from "lucide-react";
import { COMPANY } from "@/lib/demo-docs";
import { money } from "@/lib/format";

export const metadata = { title: "Email preview — payment receipt" };

// Rachel Donovan, contract #1 — the footings payment (demo)
const R = {
  first: "Rachel",
  name: "Rachel Donovan",
  email: "rachel.donovan@example.com",
  number: "R-2026-031-03",
  date: "Sep 24, 2026",
  amount: 33904,
  method: "Check #2207",
  step: "Upon installation of footings",
  contract: "Contract #1 — Retaining wall, 7025 Neptune Pl, La Jolla",
  total: 85760,
  paidSoFar: 68808,
  next: { name: "Upon stucco installation", amount: 8476 },
};

/** Sent automatically by email + text the moment a payment is marked as received. */
export default function ReceiptEmail() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1fr_300px]">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-surface px-5 py-3 text-sm">
          <div className="text-base font-semibold">Payment received — thank you! Receipt {R.number}</div>
          <div className="mt-1 text-xs text-muted"><b className="text-text">MD Golden Builders</b> &lt;CRM@mdgoldenbuilders.com&gt; → {R.name} &lt;{R.email}&gt;</div>
        </div>
        <div className="mx-auto max-w-xl px-5 py-6 text-[15px] leading-relaxed">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.png" alt="MD Golden Builders" className="mx-auto mb-5 h-16 w-auto" />
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-10 text-ok" />
            <div className="mt-1 text-3xl font-bold">{money(R.amount)}</div>
            <div className="text-sm text-muted">received {R.date} · {R.method}</div>
          </div>
          <p className="mt-5">Hi {R.first}, thank you! Here is your receipt.</p>
          <div className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm">
            <div className="flex justify-between gap-3"><span className="text-muted">Receipt #</span><b>{R.number}</b></div>
            <div className="flex justify-between gap-3"><span className="text-muted">For</span><span className="text-right">{R.step}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted">Contract</span><span className="text-right">{R.contract}</span></div>
            <div className="mt-2 border-t border-border pt-2" />
            <div className="flex justify-between"><span className="text-muted">Contract total</span><span>{money(R.total)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Paid so far</span><b className="text-ok">{money(R.paidSoFar)}</b></div>
            <div className="flex justify-between"><span className="text-muted">Remaining</span><b>{money(R.total - R.paidSoFar)}</b></div>
          </div>
          <p className="mt-4 text-sm">Next step: <b>{R.next.name}</b> — {money(R.next.amount)}. We&apos;ll let you know when we get there.</p>
          <p className="mt-5">Meidan Deuitsch<br /><span className="text-sm text-muted">Owner, MD Golden Builders · {COMPANY.phone}</span></p>
          <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted">
            <div className="mb-1 flex justify-center text-gold">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-3.5 fill-current" />)}</div>
            {COMPANY.name} · {COMPANY.license} · {COMPANY.address}
          </div>
        </div>
      </div>
      <div className="h-fit">
        <div className="mb-2 text-xs font-semibold text-muted">Same moment, by text:</div>
        <div className="rounded-[2rem] border-8 border-black bg-white p-3 shadow-lg">
          <div className="mb-3 text-center text-[11px] text-muted">MD Golden Builders · (858) 332-2168</div>
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-surface px-3 py-2 text-[13px]">
            Hi {R.first}, we received your payment of {money(R.amount)} — thank you! 🙏 Paid so far {money(R.paidSoFar)} of {money(R.total)}. Receipt: <span className="text-info underline">app.mdgoldenbuilders.com/r/3x9</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">Goes out automatically when Laline or Meidan marks the payment as received (with the check photo / Zelle screenshot).</p>
      </div>
    </div>
  );
}
