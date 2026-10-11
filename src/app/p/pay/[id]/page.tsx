import { Banknote, CheckCircle2, CreditCard, Landmark, Smartphone } from "lucide-react";
import { COMPANY, DEMO_CONTRACT as K } from "@/lib/demo-docs";
import { money } from "@/lib/format";

export const metadata = { title: "Contract signed — choose how to pay" };

const OPTIONS = [
  { key: "zelle", icon: Smartphone, title: "Zelle", detail: COMPANY.zelle, note: "No fee · fastest", best: true },
  { key: "venmo", icon: Smartphone, title: "Venmo", detail: "MD Golden Builders", note: "No fee" },
  { key: "card", icon: CreditCard, title: "Credit / debit card", detail: "Secure Square checkout", note: "Processing fee applies" },
  { key: "check", icon: Landmark, title: "Check", detail: "Payable to MD Golden Builders", note: "We pick it up at the site" },
  { key: "cash", icon: Banknote, title: "Cash", detail: "Paid to Meidan, receipt provided", note: "" },
];

/** Shown right after the customer finishes signing: pick a deposit payment method, done. */
export default async function PayPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const chosen = OPTIONS.find((o) => o.key === m);

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-light.png" alt="MD Golden Builders" className="mx-auto mb-6 h-14 w-auto" />

      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <CheckCircle2 className="mx-auto size-12 text-ok" />
        <h1 className="mt-2 text-xl font-bold">Contract signed — welcome aboard, {K.customer.first}!</h1>
        <p className="mt-1 text-sm text-muted">A fully signed copy is on its way to your email.</p>
      </div>

      {!chosen ? (
        <div className="mt-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-sm font-semibold">Down payment due now</div>
              <div className="text-xs text-muted">{K.title}</div>
            </div>
            <div className="text-2xl font-bold">{money(1000)}</div>
          </div>
          <div className="mt-4 text-sm font-semibold">How would you like to pay?</div>
          <div className="mt-2 space-y-2">
            {OPTIONS.map(({ key, icon: Icon, title, detail, note, best }) => (
              <a key={key} href={`?m=${key}`} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:border-gold hover:bg-gold-soft">
                <Icon className="size-5 text-gold-text" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{title} {best && <span className="ml-1 rounded-full bg-ok-soft px-1.5 text-[10px] text-ok">Recommended</span>}</span>
                  <span className="block text-xs text-muted [overflow-wrap:anywhere]">{detail}</span>
                  {note && <span className="block text-[11px] text-gold-text">{note}</span>}
                </span>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-gold bg-gold-soft p-5 text-center">
          <div className="text-sm font-semibold">You chose {chosen.title}</div>
          <div className="mt-1 text-2xl font-bold">{money(1000)}</div>
          {chosen.key === "zelle" && <p className="mt-2 text-sm">Send to <b className="break-all">{COMPANY.zelle}</b> and add “{K.customer.name.split(" ").pop()} — deposit” in the memo.</p>}
          {chosen.key === "card" && <p className="mt-2 text-sm">Opening secure Square checkout…</p>}
          {chosen.key === "check" && <p className="mt-2 text-sm">Meidan will collect the check at the site.</p>}
          <p className="mt-3 text-xs text-muted">That&apos;s it — we&apos;ll text you as soon as the payment is received. Welcome to the MD Golden Builders family!</p>
        </div>
      )}
    </div>
  );
}
