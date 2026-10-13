import { BadgeCheck, FileText, Paperclip, Play, Star } from "lucide-react";
import { COMPANY, DEMO_CONTRACT as K } from "@/lib/demo-docs";
import { money } from "@/lib/format";

export const metadata = { title: "Email preview — welcome to MD Golden Builders" };

const IN_HOUSE = ["Design & plans", "Permits with the city", "Demolition & excavation", "Concrete, framing & masonry", "Plumbing & electrical", "Stucco, drywall & finishes", "Final inspection & clean-up"];

/** Sent automatically the moment a new project is created. */
export default function WelcomeEmail() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1fr_300px]">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-surface px-5 py-3 text-sm">
          <div className="text-base font-semibold">Welcome to MD Golden Builders, {K.customer.first}! 🏡</div>
          <div className="mt-1 text-xs text-muted"><b className="text-text">MD Golden Builders</b> &lt;CRM@mdgoldenbuilders.com&gt; → {K.customer.name} &lt;{K.customer.email}&gt;</div>
        </div>

        <div className="mx-auto max-w-xl px-5 py-6 text-[15px] leading-relaxed">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.png" alt="MD Golden Builders" className="mx-auto mb-5 h-16 w-auto" />
          <p>Hi {K.customer.first},</p>
          <p className="mt-3">Welcome to the MD Golden Builders family — and thank you for trusting us with your home. Your project is officially on our schedule.</p>

          {/* Video / photo collage — to prepare */}
          <div className="relative mt-5 aspect-video overflow-hidden rounded-xl" style={{ background: "linear-gradient(135deg, hsl(35 30% 55%), hsl(25 35% 30%))" }}>
            <div className="absolute inset-0 grid grid-cols-3 gap-0.5 opacity-40">
              {[20, 60, 100, 140, 180, 220].map((h) => <div key={h} style={{ background: `linear-gradient(135deg, hsl(${h} 20% 60%), hsl(${h + 30} 25% 35%))` }} />)}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-black shadow"><Play className="ml-1 size-7 fill-current" /></span>
              <span className="mt-2 text-sm font-semibold drop-shadow">Meet MD Golden Builders · 1 min</span>
            </div>
            <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">Placeholder — video / photo collage to prepare</span>
          </div>

          <div className="mt-5 rounded-xl border border-gold/50 bg-gold-soft/40 p-4">
            <div className="font-semibold">We do everything in-house — A to Z</div>
            <p className="mt-1 text-sm text-muted">One team, one contract, one phone number. You never have to chase different companies.</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {IN_HOUSE.map((s) => <span key={s} className="rounded-full border border-gold/40 bg-card px-2 py-0.5 text-xs">✓ {s}</span>)}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-surface p-4 text-sm">
            <div className="mb-1 font-semibold">Your project</div>
            <div className="flex justify-between gap-3"><span className="text-muted">What</span><span className="text-right">{K.title}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted">Where</span><span className="text-right">{K.customer.address}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted">Estimated start</span><span>{K.start}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted">Estimated completion</span><span>{K.finish}</span></div>
          </div>

          <div className="mt-5 text-sm font-semibold">Your payments, step by step</div>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {K.schedule.map((m, i) => (
                <tr key={m.name} className="border-b border-border">
                  <td className="py-1.5 pr-2 align-top text-muted">{i + 1}.</td>
                  <td className="py-1.5">{m.name}{i === 0 && <span className="ml-1.5 rounded bg-ok-soft px-1 text-[11px] font-semibold text-ok">Paid ✓</span>}</td>
                  <td className="py-1.5 text-right font-semibold">{money(m.amount)}</td>
                </tr>
              ))}
              <tr><td /><td className="py-2 font-bold">Total</td><td className="py-2 text-right font-bold">{money(K.price)}</td></tr>
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted">We&apos;ll send a payment request when each step is reached. Pay by card, ACH, Zelle ({COMPANY.zelle}), Venmo or check — you get a receipt automatically every time.</p>

          <div className="mt-5 text-sm font-semibold">Attached</div>
          <div className="mt-2 space-y-2">
            {[["Contract-Whitman-Garden-Wall-SIGNED.pdf", "Signed contract · 5 pages"], ["Scope-of-Work-Whitman.pdf", "Additional Description — full scope · 2 pages"]].map(([n, d]) => (
              <div key={n} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <Paperclip className="size-4 text-muted" /><FileText className="size-4 text-bad" />
                <span className="min-w-0 flex-1 truncate">{n}</span><span className="hidden text-xs text-muted sm:block">{d}</span>
              </div>
            ))}
          </div>

          {/* License card — the real photo of the license goes here */}
          <div className="mt-4 rounded-xl border-2 border-[#1d4e89]/40 bg-[#f4f7fb] p-4 text-[#1d3557]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide"><BadgeCheck className="size-4" /> Contractors State License Board · California</div>
            <div className="mt-2 text-lg font-bold">MD Golden Builders</div>
            <div className="text-sm">License #1128874 · <b>Active</b></div>
            <div className="mt-1 text-xs opacity-75">Licensed, bonded &amp; insured · verify anytime at cslb.ca.gov</div>
            <div className="mt-2 text-[10px] opacity-60">(The real photo of our license will be shown here)</div>
          </div>

          <p className="mt-6">From here on you&apos;ll get photo updates as we go, and you can text me any time on this number.</p>
          <p className="mt-3">Welcome aboard,<br />Meidan Deuitsch<br /><span className="text-sm text-muted">Owner, MD Golden Builders · {COMPANY.phone}</span></p>

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
            Hi {K.customer.first}, welcome to MD Golden Builders! 🏡 We just sent you an email with your signed contract, the scope of work, our license and your payment schedule. Save this number — it&apos;s our direct line.
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">Goes out automatically the moment the project is created. Nobody has to remember.</p>
      </div>
    </div>
  );
}
