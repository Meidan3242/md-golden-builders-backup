import { CalendarClock, CheckCircle2, CreditCard, FileSignature, Landmark, MessageCircle, ShieldCheck, Star } from "lucide-react";
import { Soon } from "@/components/ui";
import { COMPANY } from "@/lib/demo-docs";
import { money } from "@/lib/format";

type Milestone = { name: string; pct: number | null; amount?: number };

export interface CustomerDocProps {
  kind: "Estimate" | "Change Order";
  number: number;
  date: string;
  subline: string; // "Valid until …" or "Adds to contract …"
  customer: { name: string; first: string; address: string };
  title: string;
  note: string;
  sections: { title: string; items: string[]; price?: number }[];
  exclusions: string[];
  total: number;
  schedule: Milestone[];
  /** Estimates take a $1,000 / 10% deposit first; change orders are split by pct only. */
  withDeposit: boolean;
  warranty?: string;
  extra?: React.ReactNode;
  signHref?: string;
  /** Replaces the Approve & sign / Meet / Ask buttons (real estimates: the approve box). */
  action?: React.ReactNode;
  /** Ready-made payment rows (real estimates); otherwise built from `schedule`. */
  rows?: { name: string; amount: number }[];
}

/** Customer-facing estimate / change-order page. Same look for both, mobile first. */
export function CustomerDoc(d: CustomerDocProps) {
  const deposit = d.withDeposit ? Math.min(1000, Math.round(d.total * 0.1)) : 0;
  const rest = d.total - deposit;
  const amount = (m: Milestone) => (m.pct === null ? deposit : Math.round(rest * m.pct));

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-10">
      <header className="mb-5 flex items-start justify-between gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-light.png" alt="MD Golden Builders" className="h-14 w-auto" />
        <div className="text-right text-xs text-muted">
          <div className="text-sm font-bold text-text">{d.kind} #{d.number}</div>
          <div>{d.date}</div>
          <div>{d.subline}</div>
        </div>
      </header>

      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-gold-text">Prepared for</div>
          <div className="text-xl font-bold">{d.customer.name}</div>
          <div className="text-sm text-muted">{d.customer.address}</div>
          <div className="mt-4 flex gap-3 rounded-xl bg-gold-soft p-3">
            <span className="gold-gradient flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black">MD</span>
            <p className="text-sm">
              <b>Hi {d.customer.first},</b> {d.note}
              <span className="mt-1 block text-xs text-muted">— Meidan, Owner · {COMPANY.phone}</span>
            </p>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-4">
            <div>
              <div className="text-xs text-muted">{d.kind === "Change Order" ? "Change order amount" : "Total investment"}</div>
              <div className="text-3xl font-bold tracking-tight">{money(d.total)}</div>
            </div>
            <div className="text-right text-xs text-muted">{d.title}</div>
          </div>
          {d.action ?? (
            <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
              <a href={d.signHref} className="gold-gradient flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black"><FileSignature className="size-4" /> Approve & sign</a>
              <Soon className="flex items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium"><CalendarClock className="size-4" /> Meet</Soon>
              <Soon className="flex items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium"><MessageCircle className="size-4" /> Ask</Soon>
            </div>
          )}
        </section>

        {d.extra}

        <section className="rounded-2xl border border-border bg-card p-5">
          <h1 className="text-lg font-bold">{d.title}</h1>
          <div className="mt-3 space-y-4">
            {d.sections.map((s, i) => (
              <div key={`${i}-${s.title}`}>
                <h3 className="flex items-baseline justify-between gap-3 text-sm font-semibold"><span>{i + 1}. {s.title}</span>{s.price ? <span>{money(s.price)}</span> : null}</h3>
                <ul className="mt-1 space-y-1">
                  {s.items.map((it, j) => (
                    <li key={j} className="flex gap-2 text-sm text-muted"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />{it}</li>
                  ))}
                </ul>
              </div>
            ))}
            {d.exclusions.length > 0 && <div className="rounded-xl bg-surface p-3 text-xs text-muted"><b className="text-text">Not included:</b> {d.exclusions.join(" · ")}</div>}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-lg font-bold">Payment schedule</h2>
          <ol className="space-y-1.5 text-sm">
            {(d.rows ?? d.schedule.map((m) => ({ name: m.name, amount: amount(m) }))).map((m, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2">
                <span className="gold-gradient flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-black">{i + 1}</span>
                <span className="min-w-0 flex-1">{m.name}</span>
                <span className="font-semibold">{money(m.amount)}</span>
              </li>
            ))}
            <li className="flex justify-between px-3 pt-2 text-base font-bold"><span>Total</span><span>{money(d.total)}</span></li>
          </ol>
          {d.withDeposit && <p className="mt-2 text-[11px] text-muted">Deposit is $1,000 or 10% of the contract, whichever is less (California law). Each payment is due only after that work is done.</p>}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-lg font-bold">Easy ways to pay</h2>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-border p-3"><div className="font-semibold">Zelle</div><div className="text-xs text-muted">Details sent with your payment request</div></div>
            <div className="rounded-xl border border-border p-3"><div className="font-semibold">Venmo</div><div className="text-xs text-muted">MD Golden Builders — link in every payment request</div></div>
            <div className="rounded-xl border border-border p-3"><div className="flex items-center gap-1 font-semibold"><Landmark className="size-4" /> Check</div><div className="text-xs text-muted">Payable to MD Golden Builders</div></div>
            <div className="rounded-xl border border-border p-3"><div className="flex items-center gap-1 font-semibold"><CreditCard className="size-4" /> Card</div><div className="text-xs text-muted">Secure link (processing fee applies)</div></div>
          </div>
          <p className="mt-2 text-xs text-muted">Financing available through Foundation Finance — ask us about monthly payments.</p>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4 text-sm"><ShieldCheck className="mb-1 size-5 text-gold-text" /><b>Licensed & insured</b><div className="text-xs text-muted">{COMPANY.license}</div></div>
          {d.warranty && <div className="rounded-2xl border border-border bg-card p-4 text-sm"><CheckCircle2 className="mb-1 size-5 text-gold-text" /><b>{d.warranty}</b><div className="text-xs text-muted">In writing, at completion</div></div>}
          <div className="rounded-2xl border border-border bg-card p-4 text-sm">
            <div className="mb-1 flex text-gold">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-4 fill-current" />)}</div>
            <b>Loved by San Diego homeowners</b>
            <div className="text-xs"><a className="text-gold-text" href={COMPANY.reviews.google}>Google</a> · <a className="text-gold-text" href={COMPANY.reviews.yelp}>Yelp</a> · <a className="text-gold-text" href={COMPANY.reviews.thumbtack}>Thumbtack</a></div>
          </div>
        </section>

        <p className="text-center text-xs text-muted">{COMPANY.name} · {COMPANY.license} · {COMPANY.address} · {COMPANY.phone}</p>
      </div>
    </div>
  );
}
