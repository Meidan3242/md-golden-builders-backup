import { Dancing_Script } from "next/font/google";
import { CONTRACTOR, jobsOf, P1, P3, P5, PAGE_H, PAGE_W, type ContractData, type ContractorSign, type OwnerSign, type Spot } from "@/lib/contract-form";
import { money } from "@/lib/format";
import { ContractPager } from "./contract-pager";

const script = Dancing_Script({ subsets: ["latin"], weight: "600" });
const INK = "#1b2f6e"; // filled-in text and signatures: dark blue, like a pen

const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "numeric", day: "numeric", year: "numeric" }) : "");
const longDay = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "long", day: "numeric", year: "numeric" }) : "");

/** Text written on the form, sitting on the line at `spot`. Sizes are in pixels of the 935-wide page and scale with it. */
function W({ at, size = 13, sign, children }: { at: Spot; size?: number; sign?: boolean; children: React.ReactNode }) {
  const px = sign ? size + 6 : size;
  const h = px * 1.3;
  return (
    <div
      className={`absolute overflow-hidden text-ellipsis whitespace-nowrap leading-none ${sign ? script.className : ""}`}
      style={{ left: `${(at.x / PAGE_W) * 100}%`, top: `${((at.y - h) / PAGE_H) * 100}%`, width: `${(at.w / PAGE_W) * 100}%`, height: `${(h / PAGE_H) * 100}%`, fontSize: `${(px / PAGE_W) * 100}cqw`, color: INK, paddingTop: `${((h - px) / PAGE_W) * 100}cqw` }}
    >
      {children}
    </div>
  );
}

/** A gold "sign here" spot the customer still has to fill. */
function Todo({ at, label }: { at: Spot; label: string }) {
  return (
    <div className="absolute flex items-center justify-center rounded-sm bg-[#f5c542] font-bold text-black ring-2 ring-[#b8902f] print:hidden" style={{ left: `${(at.x / PAGE_W) * 100}%`, top: `${((at.y - 22) / PAGE_H) * 100}%`, width: `${(Math.max(at.w, 46) / PAGE_W) * 100}%`, height: `${(22 / PAGE_H) * 100}%`, fontSize: `${(11 / PAGE_W) * 100}cqw` }}>
      {label}
    </div>
  );
}

const Check = ({ at }: { at: Spot }) => <W at={{ x: at.x - 1, y: at.y + 2, w: at.w + 6 }} size={at.w + 4}>✓</W>;

function Page({ n, children }: { n: number; children?: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[820px] break-after-page bg-white shadow-[0_1px_8px_rgba(0,0,0,0.08)] print:max-w-[6.1in] print:shadow-none" style={{ aspectRatio: `${PAGE_W} / ${PAGE_H}`, containerType: "inline-size" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/forms/form203-${n}.png`} alt={`Home Improvement Contract — page ${n} of 5`} className="absolute inset-0 h-full w-full" />
      {children}
    </div>
  );
}

/** Wraps text into lines of about `max` characters. */
function lines(text: string, max: number) {
  const out: string[] = [];
  let cur = "";
  for (const w of text.split(/\s+/)) {
    if ((cur + " " + w).trim().length > max && cur) {
      out.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) out.push(cur);
  return out;
}

export function ContractDocument({ number, d, contractor, owner, todo }: { number: number; d: ContractData; contractor?: ContractorSign; owner?: OwnerSign; todo?: boolean }) {
  const desc = [
    "See the attached Additional Description,",
    ...lines(`which is part of this contract: ${d.title}. Work includes: ${jobsOf(d).map((j) => (j.steps.some((s) => s.title) ? `${j.title} (${j.steps.map((s) => s.title).filter(Boolean).join(", ")})` : j.title)).join("; ")}. Exclusions are listed in the Additional Description.`, 112),
  ];
  const rows = d.payments.length <= 5 ? d.payments : [...d.payments.slice(0, 4), { name: "Remaining stages — see Additional Description", amount: d.payments.slice(4).reduce((a, p) => a + p.amount, 0) }];
  const five = owner ? owner.age65 : !!d.age65;
  const arb = owner ? owner.arbitration : !!d.arbitration;
  const notice = owner ? (five ? P3.five : P3.three) : null;
  const ownerTodo = todo && !owner;

  return (
    <ContractPager
      labels={["Home Improvement Contract", "Terms and Conditions", "Right to Cancel · Notice of Cancellation", "Statutory Notices · Insurance · Liens", "Arbitration · Customer Acknowledgment", "Additional Description — scope & payments"]}
      todo={ownerTodo ? [true, false, true, false, true, true] : undefined}
      pages={[
      <Page key={1} n={1}>
        <W at={P1.contractorName}>{CONTRACTOR.name}</W>
        <W at={P1.license}>{CONTRACTOR.license}</W>
        <W at={P1.contractorStreet}>{CONTRACTOR.street}</W>
        <W at={P1.contractorCity}>{CONTRACTOR.city}</W>
        <W at={P1.contractorPhone}>{CONTRACTOR.phone}</W>
        <W at={P1.contractorEmail}>{CONTRACTOR.email}</W>
        <W at={P1.ownerName}>{d.owner.name}</W>
        <W at={P1.ownerStreet}>{d.owner.street}</W>
        <W at={P1.ownerCity}>{d.owner.cityStateZip}</W>
        <W at={P1.ownerPhone}>{d.owner.phone}</W>
        <W at={P1.ownerEmail}>{d.owner.email}</W>
        <W at={P1.workAt}>{d.workAddress}</W>
        <W at={P1.lender}>{d.lender || "None"}</W>
        {desc.slice(0, P1.desc.length).map((t, i) => <W key={i} at={P1.desc[i]!}>{t}</W>)}
        <W at={P1.commencement}>{d.commencement}</W>
        <W at={P1.start}>{d.startDate}</W>
        <W at={P1.completion}>{d.completionDate}</W>
        <W at={P1.price}>{money(d.price).replace("$", "")}</W>
        <W at={P1.down}>{money(d.downPayment).replace("$", "")}</W>
        <W at={P1.finance}>None</W>
        {rows.map((r, i) => (
          <div key={i}>
            <W at={P1.rows[i]!.amount}>{money(r.amount).replace("$", "")}</W>
            <W at={P1.rows[i]!.desc} size={11.5}>{r.name}</W>
          </div>
        ))}
        <W at={P1.allowances}>{d.allowances || "None"}</W>
        <W at={P1.firm}>{CONTRACTOR.name}</W>
        <W at={P1.salesman}>{CONTRACTOR.salesman}</W>
        {contractor && (
          <>
            <W at={P1.contractorSign} sign>{contractor.name}</W>
            <W at={P1.contractorDate} size={11}>{day(contractor.at)}</W>
          </>
        )}
        {owner && (
          <>
            <W at={P1.receiptInitials} sign>{owner.initials}</W>
            <W at={P1.age}>{owner.age65 ? "65 or older" : "Under 65"}</W>
            <W at={P1.ageInitials} sign>{owner.initials}</W>
            <W at={five ? P1.box5 : P1.box3} sign>{owner.initials}</W>
            {owner.arbitration && <W at={P1.boxArb} sign>{owner.initials}</W>}
            <W at={P1.ownerSign} sign>{owner.name}</W>
            <W at={P1.ownerDate} size={11}>{day(owner.at)}</W>
          </>
        )}
        {ownerTodo && (
          <>
            <W at={P1.age}>{five ? "65 or older" : "Under 65"}</W>
            <Todo at={P1.receiptInitials} label="Initial" />
            <Todo at={P1.ageInitials} label="Initial" />
            <Todo at={five ? P1.box5 : P1.box3} label="Initial" />
            {arb && <Todo at={P1.boxArb} label="Initial" />}
            <Todo at={P1.ownerSign} label="Sign here" />
          </>
        )}
      </Page>,

      <Page key={2} n={2} />,

      <Page key={3} n={3}>
        {owner && notice && (
          <>
            <W at={P3.ackName}>{owner.name}</W>
            <W at={P3.ackDate}>{day(owner.at)}</W>
            <Check at={five ? P3.check5 : P3.check3} />
            <W at={P3.ackSign} sign>{owner.name}</W>
            <W at={notice.date}>{day(owner.at)}</W>
            <W at={notice.by}>{day(owner.cancelBy)}</W>
            <W at={notice.seller}>{CONTRACTOR.name}</W>
            <W at={notice.at} size={12}>{`${CONTRACTOR.street}, ${CONTRACTOR.city}`}</W>
          </>
        )}
        {ownerTodo && <Todo at={P3.ackSign} label="Sign here" />}
      </Page>,

      <Page key={4} n={4} />, // insurance boxes left blank for now (owner's decision)

      <Page key={5} n={5}>
        {owner && arb &&
          P5.arb.map((a, i) => (
            <div key={i}>
              {contractor && <W at={a.contractor} sign>{contractor.initials}</W>}
              <W at={a.owner} sign>{owner.initials}</W>
            </div>
          ))}
        {owner && (
          <>
            {P5.ackChecks.map((c, i) => <Check key={i} at={c} />)}
            <W at={P5.ownerPrint}>{owner.name}</W>
            <W at={P5.ownerSign} sign>{owner.name}</W>
            <W at={P5.ownerDate}>{day(owner.at)}</W>
          </>
        )}
        {ownerTodo && arb && P5.arb.map((a, i) => <Todo key={i} at={a.owner} label="Initial" />)}
        {ownerTodo && <Todo at={P5.ownerSign} label="Sign here" />}
      </Page>,

      <div key={6} className="space-y-4 print:space-y-0">
        <AdditionalDescription number={number} d={d} contractor={contractor} owner={owner} todo={ownerTodo} />
        {owner && contractor && <SignatureRecord number={number} contractor={contractor} owner={owner} />}
      </div>,
      ]}
    />
  );
}

const th = "border-b border-[#1c1c1c] pb-1 text-left text-[11px] font-semibold uppercase tracking-wider text-[#555]";

/** Our own pages: the full scope and payment schedule. Signed by both, like the form. */
function AdditionalDescription({ number, d, contractor, owner, todo }: { number: number; d: ContractData; contractor?: ContractorSign; owner?: OwnerSign; todo?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[820px] bg-white px-6 py-8 text-[13px] leading-snug text-[#1c1c1c] shadow-[0_1px_8px_rgba(0,0,0,0.08)] sm:px-12 print:break-before-page print:px-0 print:shadow-none">
      <div className="text-center">
        <div className="font-letter text-xl font-bold tracking-[0.15em]">ADDITIONAL DESCRIPTION</div>
        <div className="mt-1 text-xs text-[#555]">Attachment to the Home Improvement Contract No. {number} · {CONTRACTOR.name} · {CONTRACTOR.license} · {CONTRACTOR.phone}</div>
      </div>
      <div className="mt-4 grid gap-2 border-y border-[#1c1c1c]/40 py-2 text-xs sm:grid-cols-2">
        <div><b>Owner:</b> {d.owner.name}<br /><b>Work at:</b> {d.workAddress}</div>
        <div className="sm:text-right"><b>Contract No.</b> {number} · <b>Estimate No.</b> {d.estimateNumber}<br /><b>Start:</b> {d.startDate} · <b>Completion:</b> {d.completionDate}</div>
      </div>
      <p className="mt-3 text-xs text-[#444]">This Additional Description is part of the Home Improvement Contract between the parties named above and is incorporated into it. It describes the work, the significant materials and equipment, and every progress payment.</p>

      <h3 className="font-letter mt-5 text-base font-bold">Scope of Work — {d.title}</h3>
      <table className="mt-1 w-full">
        <thead><tr><th className={`${th} w-8`}>No.</th><th className={th}>Description</th><th className={`${th} w-24 text-right`}>Amount</th></tr></thead>
        <tbody>
          {jobsOf(d).map((j, i) => (
            <tr key={i} className="break-inside-avoid border-b border-[#e3ddd0] align-top">
              <td className="py-2 text-[#777]">{i + 1}</td>
              <td className="py-2 pr-3">
                <div className="font-semibold">{j.title}</div>
                {j.steps.map((s, k) => (
                  <div key={k} className="mt-1">
                    {s.title && <div className="text-[12px] font-semibold text-[#333]">{s.title}</div>}
                    {s.items.length > 0 && <ul className="list-disc pl-4 text-[12px] text-[#444]">{s.items.map((it, m) => <li key={m}>{it}</li>)}</ul>}
                  </div>
                ))}
              </td>
              <td className="py-2 text-right font-semibold tabular-nums">{j.price ? money(j.price) : ""}</td>
            </tr>
          ))}
          <tr><td /><td className="pt-2 text-right font-bold">Contract price</td><td className="pt-2 text-right font-bold tabular-nums">{money(d.price)}</td></tr>
        </tbody>
      </table>
      {d.exclusions.length > 0 && <p className="mt-3 text-xs"><b>Not included:</b> {d.exclusions.join("; ")}.</p>}
      <p className="mt-1 text-xs"><b>Allowances:</b> {d.allowances || "None"}.</p>

      <h3 className="font-letter mt-5 text-base font-bold">Schedule of Payments</h3>
      <table className="mt-1 w-full break-inside-avoid">
        <tbody>
          <tr className="border-b border-[#e3ddd0]"><td className="w-8 py-1.5 text-[#777]">—</td><td className="py-1.5">Down payment (upon signing)</td><td className="w-24 py-1.5 text-right tabular-nums">{money(d.downPayment)}</td></tr>
          {d.payments.map((p, i) => (
            <tr key={i} className="border-b border-[#e3ddd0]"><td className="py-1.5 text-[#777]">{i + 1}</td><td className="py-1.5">{p.name}</td><td className="py-1.5 text-right tabular-nums">{money(p.amount)}</td></tr>
          ))}
          <tr><td /><td className="pt-1.5 text-right font-bold">Total</td><td className="pt-1.5 text-right font-bold tabular-nums">{money(d.price)}</td></tr>
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-[#555]">The down payment may not exceed $1,000 or 10 percent of the contract price, whichever is less. It is against the law for a contractor to collect payment for work not yet completed, or for materials not yet delivered. Finance charge: none.</p>

      <div className="mt-8 grid break-inside-avoid gap-6 text-xs sm:grid-cols-2">
        <div>
          <div className="relative h-10 border-b border-[#1c1c1c]">
            {owner && <span className={`${script.className} absolute bottom-0 left-1 text-2xl`} style={{ color: INK }}>{owner.name}</span>}
            {todo && <span className="absolute bottom-1 left-0 rounded-sm bg-[#f5c542] px-3 py-1 text-[11px] font-bold text-black ring-2 ring-[#b8902f] print:hidden">Sign here</span>}
          </div>
          <div className="mt-1 flex justify-between text-[#555]"><span>Owner — {d.owner.name}</span><span>{day(owner?.at)}</span></div>
        </div>
        <div>
          <div className="relative h-10 border-b border-[#1c1c1c]">
            {contractor && <span className={`${script.className} absolute bottom-0 left-1 text-2xl`} style={{ color: INK }}>{contractor.name}</span>}
          </div>
          <div className="mt-1 flex justify-between text-[#555]"><span>Contractor — {CONTRACTOR.name}</span><span>{day(contractor?.at)}</span></div>
        </div>
      </div>
      {owner && <p className="mt-6 text-[11px] text-[#555]">Signed on {longDay(owner.at)}. The owner may cancel without penalty until midnight of {longDay(owner.cancelBy)} ({owner.age65 ? "five" : "three"} business days), as explained in the Notice of Cancellation.</p>}
    </div>
  );
}

const device = (ua: string) => (/iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "Browser") + (/CriOS|Chrome\//.test(ua) && !/Edg\//.test(ua) ? " · Chrome" : /Safari\//.test(ua) ? " · Safari" : /Edg\//.test(ua) ? " · Edge" : /Firefox\//.test(ua) ? " · Firefox" : "");

/** How and when each side signed — kept with the signed copy. */
function SignatureRecord({ number, contractor, owner }: { number: number; contractor: ContractorSign; owner: OwnerSign }) {
  const t = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" }) + " PT";
  return (
    <div className="mx-auto w-full max-w-[820px] break-inside-avoid bg-white px-6 py-5 text-[11px] text-[#444] shadow-[0_1px_8px_rgba(0,0,0,0.08)] sm:px-12 print:px-0 print:shadow-none">
      <div className="font-semibold uppercase tracking-wider text-[#1c1c1c]">Electronic signature record — Contract No. {number}</div>
      <p className="mt-1">Both parties agreed to sign electronically (California Uniform Electronic Transactions Act and the federal E-SIGN Act). Each typed name below is that person&apos;s signature and initials on every place shown in this contract.</p>
      <ul className="mt-2 space-y-1">
        <li><b>Contractor:</b> {contractor.name} for {CONTRACTOR.name} — {t(contractor.at)} — IP {contractor.ip}</li>
        <li><b>Owner:</b> {owner.name} ({owner.initials}) — {t(owner.at)} — IP {owner.ip} — {device(owner.ua)}. Age: {owner.age65 ? "65 or older (5-day right to cancel)" : "under 65 (3-day right to cancel)"}. Arbitration: {owner.arbitration ? "agreed" : "not agreed"}.</li>
      </ul>
    </div>
  );
}
