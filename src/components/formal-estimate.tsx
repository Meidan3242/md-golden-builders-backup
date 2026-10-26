import { PrintButton } from "./print-button";
import { COMPANY } from "@/lib/demo-docs";
import type { EstimateJob } from "@/lib/estimate-templates";
import { money } from "@/lib/format";

// The customer's estimate as a formal business document: letterhead, scope table, payment schedule,
// acceptance block, then a short "about us" with Meidan's photo and recent work.
export const RECENT_WORK = [
  { src: "/work/kitchen.jpg", caption: "Kitchen remodel" },
  { src: "/work/bathroom.jpg", caption: "Bathroom remodel" },
  { src: "/work/deck.jpg", caption: "Deck & railing" },
  { src: "/work/pavers-fence.jpg", caption: "Pavers, fence & stairs" },
  { src: "/work/framing.jpg", caption: "Framing" },
  { src: "/work/crew.jpg", caption: "Our crew on site" },
];
const TRADES = ["ADU", "Garage Conversion", "Kitchen Remodel", "Bathroom Remodel", "Room Additions", "Full Home Remodel", "Retaining Walls", "Pavers & Hardscape", "Concrete & Driveways", "Patios & Decks", "Stucco & Exterior", "Flooring"];

const serif = "font-letter";
const label = "text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a6a1f]";

export function FormalEstimate(d: {
  number: number;
  date: string;
  validUntil: string;
  customer: { name: string; address: string; phone?: string; email?: string };
  title: string;
  note: string;
  jobs: EstimateJob[];
  /** Where an item photo is loaded from (the staff link or the customer's private link). */
  photoSrc?: (id: string) => string;
  exclusions: string[];
  total: number;
  rows: { name: string; amount: number }[];
  acceptance: React.ReactNode;
  /** Customer page only: a "Download PDF" button. */
  printable?: boolean;
}) {
  const first = d.customer.name.split(" ")[0];
  return (
    <div className="mx-auto max-w-[820px] bg-white text-[#1c1c1c] shadow-[0_1px_8px_rgba(0,0,0,0.08)] sm:border sm:border-[#e3ddd0] print:max-w-none print:border-0 print:shadow-none">
      {/* Letterhead */}
      <header className="border-b-2 border-[#b8902f] px-6 pb-5 pt-7 sm:px-12 print:px-0 print:pt-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.png" alt="MD Golden Builders" className="h-14 w-auto sm:h-16" />
          <div className="text-right">
            {d.printable && <div className="mb-2 flex justify-end"><PrintButton /></div>}
            <div className={`${serif} text-2xl tracking-[0.2em] sm:text-3xl`}>ESTIMATE</div>
            <table className="ml-auto mt-1 text-xs text-[#555]">
              <tbody>
                <tr><td className="pr-3">No.</td><td className="font-semibold text-[#1c1c1c]">{d.number}</td></tr>
                <tr><td className="pr-3">Date</td><td>{d.date}</td></tr>
                <tr><td className="pr-3">Valid until</td><td>{d.validUntil}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </header>

      <div className="space-y-8 px-6 py-7 sm:px-12 print:px-0">
        {/* From / To */}
        <section className="grid gap-6 text-sm sm:grid-cols-2">
          <div>
            <div className={label}>From</div>
            <div className={`${serif} mt-1 text-base font-bold`}>{COMPANY.name}</div>
            <div className="text-[#555]">Licensed General Contractor · {COMPANY.license}</div>
            <div className="text-[#555]">{COMPANY.address}</div>
            <div className="text-[#555]">{COMPANY.phone} · {COMPANY.email}</div>
          </div>
          <div>
            <div className={label}>Prepared for</div>
            <div className={`${serif} mt-1 text-base font-bold`}>{d.customer.name}</div>
            <div className="text-[#555]">{d.customer.address}</div>
            {(d.customer.phone || d.customer.email) && <div className="text-[#555]">{[d.customer.phone, d.customer.email].filter(Boolean).join(" · ")}</div>}
          </div>
        </section>

        {/* Letter */}
        <section className="text-[15px] leading-relaxed">
          <p className={serif}>Dear {first},</p>
          <p className="mt-2">{d.note}</p>
          <p className="mt-3">Sincerely,</p>
          <p className={`${serif} mt-1 font-bold`}>Meidan D.</p>
          <p className="text-sm text-[#555]">Owner, {COMPANY.name}</p>
        </section>

        {/* Scope */}
        <section>
          <h2 className={`${serif} border-b border-[#1c1c1c] pb-1 text-lg font-bold`}>Scope of Work — {d.title}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#d8d2c4] text-left text-[11px] uppercase tracking-wider text-[#777]">
                <th className="w-8 py-2 font-semibold">No.</th>
                <th className="py-2 font-semibold">Description</th>
                <th className="w-28 py-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {d.jobs.map((j, i) => (
                <tr key={i} className="break-inside-avoid border-b border-[#e8e3d8] align-top">
                  <td className="py-3 text-[#777]">{i + 1}</td>
                  <td className="py-3 pr-3">
                    <div className="font-semibold">{j.title}</div>
                    {j.steps.map((s, k) => (
                      <div key={k} className="mt-2 break-inside-avoid">
                        {s.title && <div className="text-[13px] font-semibold text-[#333]">{s.title}</div>}
                        {s.items.length > 0 && (
                          <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-[13px] text-[#444]">
                            {s.items.map((it, m) => <li key={m}>{it}</li>)}
                          </ul>
                        )}
                        {d.photoSrc && !!s.photos?.length && (
                          <div className="mt-2 grid max-w-md grid-cols-2 gap-2 sm:grid-cols-3">
                            {s.photos.map((p) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={p} src={d.photoSrc!(p)} alt={s.title || j.title} loading="lazy" className="aspect-[4/3] w-full border border-[#e3ddd0] object-cover" />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </td>
                  <td className="py-3 text-right font-semibold tabular-nums">{j.price ? money(j.price) : ""}</td>
                </tr>
              ))}
              <tr className="break-inside-avoid">
                <td />
                <td className={`${serif} pt-3 text-right text-base font-bold`}>Total Contract Price</td>
                <td className={`${serif} pt-3 text-right text-base font-bold tabular-nums`}>{money(d.total)}</td>
              </tr>
            </tbody>
          </table>
          {d.exclusions.length > 0 && (
            <p className="mt-4 text-[13px] text-[#555]"><span className="font-semibold text-[#1c1c1c]">Not included: </span>{d.exclusions.join("; ")}.</p>
          )}
        </section>

        {/* Payments */}
        <section>
          <h2 className={`${serif} border-b border-[#1c1c1c] pb-1 text-lg font-bold`}>Payment Schedule</h2>
          <table className="w-full text-sm">
            <tbody>
              {d.rows.map((r, i) => (
                <tr key={i} className="break-inside-avoid border-b border-[#e8e3d8]">
                  <td className="w-8 py-2 text-[#777]">{i + 1}</td>
                  <td className="py-2">{r.name}</td>
                  <td className="w-28 py-2 text-right tabular-nums">{money(r.amount)}</td>
                </tr>
              ))}
              <tr>
                <td />
                <td className="pt-2 text-right font-semibold">Total</td>
                <td className="pt-2 text-right font-semibold tabular-nums">{money(d.total)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-[#666]">
            The deposit is $1,000 or 10% of the contract price, whichever is less, as required by California law. Each progress payment is due only after the corresponding work is completed.
            Payment by check, Zelle, Venmo or card; details are sent with each payment request.
          </p>
        </section>

        {/* Acceptance */}
        <section className="break-inside-avoid border border-[#1c1c1c] p-5">
          <h2 className={`${serif} text-lg font-bold`}>Acceptance of Estimate</h2>
          <p className="mt-1 text-[13px] text-[#555]">
            By approving below, you accept this estimate and ask {COMPANY.name} to prepare the contract. The contract (with your three-day right to cancel) is sent separately for signature. Nothing is charged at this step.
          </p>
          <div className="print:hidden">{d.acceptance}</div>
          {/* On paper: sign and date by hand */}
          <div className="mt-8 hidden grid-cols-[2fr_1fr] gap-6 text-xs text-[#555] print:grid">
            <div className="border-t border-[#1c1c1c] pt-1">Property owner signature</div>
            <div className="border-t border-[#1c1c1c] pt-1">Date</div>
          </div>
        </section>

        {/* About */}
        <section className="border-t border-[#d8d2c4] pt-7">
          <div className="mx-auto max-w-xl text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/meidan-round.png" alt="Meidan D., Project Manager" className="mx-auto size-36 rounded-full bg-white ring-2 ring-[#b8902f] ring-offset-4 sm:size-40" />
            <div className={`${label} mt-5`}>About us</div>
            <h2 className={`${serif} mt-1 text-xl font-bold`}>Meidan D.</h2>
            <div className="text-sm text-[#555]">Project Manager</div>
            <p className="mt-3 text-[15px] leading-relaxed">
              {COMPANY.name} is a licensed general contractor ({COMPANY.license}) serving San Diego County. I personally oversee every project, and our own crew handles the work from start to finish —
              plans and permits, construction, finishes and the final inspection. You will always have one person to call: me.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[#666]">{TRADES.join(" | ")}</p>
          </div>
          <div className="mt-6">
            <div className={`${label} text-center`}>Our work</div>
            <div className="mt-2 grid break-inside-avoid grid-cols-2 gap-3 sm:grid-cols-3">
              {RECENT_WORK.map((w) => (
                <figure key={w.src} className="break-inside-avoid">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={w.src} alt={w.caption} className="aspect-[3/2] w-full border border-[#e3ddd0] object-cover" />
                  <figcaption className="mt-1 text-[11px] text-[#777]">{w.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t-2 border-[#b8902f] px-6 py-4 text-center text-[11px] text-[#777] sm:px-12 print:px-0">
        {COMPANY.name} · {COMPANY.license} · {COMPANY.address} · {COMPANY.phone} · {COMPANY.web}
      </footer>
    </div>
  );
}
