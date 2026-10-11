import { CalendarClock, CheckCircle2, CreditCard, FileSignature, Landmark, MessageCircle, ShieldCheck, Star } from "lucide-react";
import { COMPANY, DEMO_ESTIMATE as E } from "@/lib/demo-docs";
import { EstimateOptions } from "./estimate-options";

export const metadata = { title: `Estimate #${E.number} — MD Golden Builders` };

export default function EstimatePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      <header className="mb-5 flex items-start justify-between gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-light.png" alt="MD Golden Builders" className="h-14 w-auto" />
        <div className="text-right text-xs text-muted">
          <div className="text-sm font-bold text-text">Estimate #{E.number}</div>
          <div>{E.date}</div>
          <div>Valid until {E.validUntil}</div>
        </div>
      </header>

      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-gold-text">Prepared for</div>
          <div className="text-xl font-bold">{E.customer.name}</div>
          <div className="text-sm text-muted">{E.customer.address}</div>
          <div className="mt-4 flex gap-3 rounded-xl bg-gold-soft p-3">
            <span className="gold-gradient flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black">MD</span>
            <p className="text-sm">
              <b>Hi {E.customer.first},</b> {E.note}
              <span className="mt-1 block text-xs text-muted">— Meidan, Owner · {COMPANY.phone}</span>
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h1 className="text-lg font-bold">{E.title}</h1>
          <div className="mt-3 space-y-4">
            {E.sections.map((s, i) => (
              <div key={s.title}>
                <h3 className="text-sm font-semibold">{i + 1}. {s.title}</h3>
                <ul className="mt-1 space-y-1">
                  {s.items.map((it) => (
                    <li key={it} className="flex gap-2 text-sm text-muted"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />{it}</li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="rounded-xl bg-surface p-3 text-xs text-muted">
              <b className="text-text">Not included:</b> {E.exclusions.join(" · ")}
            </div>
          </div>
        </section>

        <EstimateOptions base={E.base} options={E.options} schedule={E.schedule} />

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-lg font-bold">Easy ways to pay</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl border border-border p-3"><div className="font-semibold">Zelle</div><div className="text-xs text-muted">{COMPANY.zelle}</div></div>
            <div className="rounded-xl border border-border p-3"><div className="font-semibold">Venmo</div><div className="text-xs text-muted">@MD-Golden-Builders</div></div>
            <div className="rounded-xl border border-border p-3"><div className="flex items-center gap-1 font-semibold"><Landmark className="size-4" /> Check</div><div className="text-xs text-muted">Payable to MD Golden Builders</div></div>
            <div className="rounded-xl border border-border p-3"><div className="flex items-center gap-1 font-semibold"><CreditCard className="size-4" /> Card</div><div className="text-xs text-muted">Secure link (processing fee applies)</div></div>
          </div>
          <p className="mt-2 text-xs text-muted">Financing available — ask us about monthly payments.</p>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4 text-sm"><ShieldCheck className="mb-1 size-5 text-gold-text" /><b>Licensed & insured</b><div className="text-xs text-muted">{COMPANY.license}</div></div>
          <div className="rounded-2xl border border-border bg-card p-4 text-sm"><CheckCircle2 className="mb-1 size-5 text-gold-text" /><b>{E.warranty}</b><div className="text-xs text-muted">In writing, at completion</div></div>
          <div className="rounded-2xl border border-border bg-card p-4 text-sm">
            <div className="mb-1 flex text-gold">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-4 fill-current" />)}</div>
            <b>Loved by San Diego homeowners</b>
            <div className="text-xs"><a className="text-gold-text" href={COMPANY.reviews.google}>Google</a> · <a className="text-gold-text" href={COMPANY.reviews.yelp}>Yelp</a> · <a className="text-gold-text" href={COMPANY.reviews.thumbtack}>Thumbtack</a></div>
          </div>
        </section>

        <p className="text-center text-xs text-muted">{COMPANY.name} · {COMPANY.license} · {COMPANY.address} · {COMPANY.phone}</p>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-4 border-t border-border bg-card/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-2">
          <a href="/p/sign/demo" className="gold-gradient flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black"><FileSignature className="size-4" /> Approve & sign</a>
          <button className="flex items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium"><CalendarClock className="size-4" /> Meet again</button>
          <button className="flex items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium"><MessageCircle className="size-4" /> Ask</button>
        </div>
      </div>
    </div>
  );
}
