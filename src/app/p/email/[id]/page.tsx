import { FileText, Paperclip, Star } from "lucide-react";
import { COMPANY, DEMO_CONTRACT as K, DEMO_ESTIMATE as E } from "@/lib/demo-docs";
import { money } from "@/lib/format";

export const metadata = { title: "Email preview — contract ready to sign" };

/** Preview of the email (and text message) the customer receives when a contract is sent. */
export default async function EmailPreview({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  if ((await searchParams).type === "estimate") return <EstimateEmail />;
  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1fr_300px]">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-surface px-5 py-3 text-sm">
          <div className="text-base font-semibold">Your contract is ready to sign — {K.title}</div>
          <div className="mt-1 text-xs text-muted">
            <b className="text-text">MD Golden Builders</b> &lt;{"CRM@mdgoldenbuilders.com"}&gt; → {K.customer.name} &lt;{K.customer.email}&gt;
          </div>
        </div>

        <div className="mx-auto max-w-xl px-5 py-6 text-[15px] leading-relaxed">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.png" alt="MD Golden Builders" className="mx-auto mb-5 h-16 w-auto" />
          <p>Hi {K.customer.first},</p>
          <p className="mt-3">Thank you for choosing MD Golden Builders! Your contract for the <b>{K.title}</b> at {K.customer.address} is ready. Please review and sign — it takes about 3 minutes from your phone.</p>

          <div className="mt-5 rounded-xl border border-border bg-surface p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted">Contract price</span><b>{money(K.price)}</b></div>
            <div className="flex justify-between"><span className="text-muted">Deposit on signing</span><b>{money(1000)}</b></div>
            <div className="flex justify-between"><span className="text-muted">Estimated start</span><span>{K.start}</span></div>
            <div className="flex justify-between"><span className="text-muted">Estimated completion</span><span>{K.finish}</span></div>
          </div>

          <div className="my-6 text-center">
            <a href="/p/sign/demo" className="gold-gradient inline-block rounded-xl px-8 py-3.5 text-base font-bold text-black shadow">Review & Sign Contract</a>
            <div className="mt-2 text-xs text-muted">Secure link · works on phone or computer</div>
          </div>

          <div className="text-sm font-semibold">Payment schedule</div>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {K.schedule.map((m, i) => (
                <tr key={m.name} className="border-b border-border">
                  <td className="py-1.5 pr-2 text-muted">{i + 1}.</td>
                  <td className="py-1.5">{m.name}</td>
                  <td className="py-1.5 text-right font-semibold">{money(m.amount)}</td>
                </tr>
              ))}
              <tr><td /><td className="py-2 font-bold">Total</td><td className="py-2 text-right font-bold">{money(K.price)}</td></tr>
            </tbody>
          </table>

          <div className="mt-5 text-sm font-semibold">What you&apos;ll sign</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted">
            <li>Home Improvement Contract (5 pages, California Form 203)</li>
            <li>Additional Description — full scope of work + payment schedule (2 pages)</li>
          </ul>
          <p className="mt-3 text-xs text-muted">You have the right to cancel within 3 business days (5 business days if you are 65 or older). The notice is included in your contract.</p>

          <div className="mt-5 flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            <Paperclip className="size-4 text-muted" />
            <FileText className="size-4 text-bad" />
            <span className="flex-1">Contract-Whitman-Garden-Wall.pdf</span>
            <span className="text-xs text-muted">7 pages · unsigned copy</span>
          </div>

          <p className="mt-6">Any questions — just reply to this email or text me.</p>
          <p className="mt-3">Meidan Deuitsch<br /><span className="text-sm text-muted">Owner, MD Golden Builders · {COMPANY.phone}</span></p>

          <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted">
            <div className="mb-1 flex justify-center text-gold">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-3.5 fill-current" />)}</div>
            {COMPANY.name} · {COMPANY.license} · {COMPANY.address}
          </div>
        </div>
      </div>

      <div className="h-fit">
        <div className="mb-2 text-xs font-semibold text-muted">The same moment, by text (from the business line):</div>
        <div className="rounded-[2rem] border-8 border-black bg-white p-3 shadow-lg">
          <div className="mb-3 text-center text-[11px] text-muted">MD Golden Builders · (858) 332-2168</div>
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-surface px-3 py-2 text-[13px]">
            Hi {K.customer.first}, it&apos;s Meidan from MD Golden Builders 🙂 Your contract for the garden wall is ready to sign: <span className="text-info underline">app.mdgoldenbuilders.com/s/x7K2</span>
            <br />Takes ~3 min on your phone. Any questions, text me here!
          </div>
          <div className="mt-2 ml-auto max-w-[60%] rounded-2xl rounded-br-sm bg-info px-3 py-2 text-[13px] text-white">Got it, signing tonight 👍</div>
        </div>
        <p className="mt-3 text-xs text-muted">You choose per customer: email, text, or both. You get a notification when they open it, and again when they sign.</p>
      </div>
    </div>
  );
}

/** Estimate email: one button, "View Estimate" — approving and signing happens inside. */
function EstimateEmail() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-surface px-5 py-3 text-sm">
          <div className="text-base font-semibold">Your estimate from MD Golden Builders — {E.title}</div>
          <div className="mt-1 text-xs text-muted"><b className="text-text">MD Golden Builders</b> &lt;CRM@mdgoldenbuilders.com&gt; → {E.customer.name}</div>
        </div>
        <div className="mx-auto max-w-xl px-5 py-6 text-[15px] leading-relaxed">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.png" alt="MD Golden Builders" className="mx-auto mb-5 h-16 w-auto" />
          <p>Hi {E.customer.first},</p>
          <p className="mt-3">It was great meeting you. As promised, here is your estimate for the <b>{E.title.toLowerCase()}</b> — the full scope, price and payment schedule.</p>
          <div className="mt-5 rounded-xl border border-border bg-surface p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted">Estimate #</span><b>{E.number}</b></div>
            <div className="flex justify-between"><span className="text-muted">Total</span><b>{money(E.base)}</b></div>
            <div className="flex justify-between"><span className="text-muted">Valid until</span><span>{E.validUntil}</span></div>
          </div>
          <div className="my-6 text-center">
            <a href="/p/estimate/demo" className="gold-gradient inline-block rounded-xl px-10 py-3.5 text-base font-bold text-black shadow">View Estimate</a>
            <div className="mt-2 text-xs text-muted">You can approve and sign right from the estimate</div>
          </div>
          <p>Questions? Just reply here or text me — happy to walk you through it.</p>
          <p className="mt-3">Meidan Deuitsch<br /><span className="text-sm text-muted">Owner, MD Golden Builders · {COMPANY.phone}</span></p>
          <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted">
            <div className="mb-1 flex justify-center text-gold">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-3.5 fill-current" />)}</div>
            {COMPANY.name} · {COMPANY.license} · {COMPANY.address}
          </div>
        </div>
      </div>
    </div>
  );
}
