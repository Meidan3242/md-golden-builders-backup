import { MailFrame, Signature } from "@/components/mail-frame";
import { DEMO_CONTRACT as K } from "@/lib/demo-docs";
import { money } from "@/lib/format";

const TRADES = ["ADU", "Garage Conversion", "Kitchen Remodel", "Bathroom Remodel", "Room Additions", "Full Home Remodel", "Retaining Walls", "Pavers & Hardscape", "Concrete & Driveways", "Patios & Decks", "Stucco & Exterior", "Flooring"];

export const metadata = { title: "Welcome email" };

/** Sent automatically the moment a new project is created — written as a personal note from Laline. */
export default function WelcomeEmail() {
  return (
    <div className="min-h-screen bg-[#f2f2f7] sm:py-2">
      <MailFrame
        from="Laline — MD Golden Builders"
        fromEmail="CRM@mdgoldenbuilders.com"
        to={`${K.customer.name}`}
        when="Today 10:42 AM"
        subject={`Welcome to MD Golden Builders, ${K.customer.first}!`}
        pdfs={[
          { name: "Whitman - Signed Contract.pdf", size: "PDF · 7 pages" },
          { name: "Whitman - Scope of Work.pdf", size: "PDF · 2 pages" },
        ]}
        image={{ src: "/license-cslb.jpg", name: "MD Golden Builders - CSLB License 1128874.jpg" }}
      >
        <p>Hi Daniel and Sarah,</p>
        <p>
          My name is Laline, and I&apos;m the office manager here at MD Golden Builders. On behalf of Meidan and the whole team —
          welcome! We&apos;re really happy you chose us for your new garden wall, and we can&apos;t wait to get started.
        </p>
        <p>I&apos;ve attached a few things for your records:</p>
        <ul className="mb-3 list-disc pl-5">
          <li>Your signed contract</li>
          <li>The scope of work — everything we&apos;ll build, step by step</li>
          <li>A copy of our contractor&apos;s license (CSLB #1128874)</li>
        </ul>
        <p>Here&apos;s your payment schedule, so there are never any surprises:</p>
        <ol className="mb-1 list-decimal pl-5">
          {K.schedule.map((m, i) => (
            <li key={m.name}>
              {m.name} — <b>{money(m.amount)}</b>
              {i === 0 && <span className="text-[#34c759]"> (received, thank you!)</span>}
            </li>
          ))}
        </ol>
        <p>
          <b>Total: {money(K.price)}</b>
          <br />
          I&apos;ll send you a short note each time we reach a step, and a receipt as soon as each payment comes in.
        </p>
        <p>If anything comes up, just reply to this email or text me at (858) 332-2168 — I&apos;m always happy to help.</p>
        <p className="mb-0">
          Warmly,
          <br />
          Laline
        </p>
        <Signature />

        <div className="mt-6 rounded-xl bg-[#f7f4ec] px-4 py-3 text-[13px] leading-relaxed text-[#3a3a3c]">
          <div className="mb-1 font-semibold text-[#1c1c1e]">A little about us</div>
          <p className="mb-2">
            We do everything ourselves, from A to Z — plans, permits, demolition, construction, finishes, final inspection and clean-up.
            One team, one contract, one number to call.
          </p>
          <p className="mb-2 font-medium text-[#1c1c1e]">{TRADES.join(" | ")}</p>
          <p className="mb-0">
            <span className="text-[#007aff] underline">▶ Meet MD Golden Builders (1 min)</span>{" "}
            <span className="rounded bg-[#fff4d6] px-1 text-[11px] text-[#8a6d00]">video coming soon</span>
          </p>
        </div>
      </MailFrame>
    </div>
  );
}
