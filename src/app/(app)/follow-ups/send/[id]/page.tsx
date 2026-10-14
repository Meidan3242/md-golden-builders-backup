import { Check, Copy, MessageSquare } from "lucide-react";
import { notFound } from "next/navigation";
import { SourceBadge } from "@/components/status";
import { BackLink, Card } from "@/components/ui";
import { getLead } from "@/lib/data";
import { TODAY } from "@/lib/demo-data";
import { date, daysFrom, money } from "@/lib/format";

/** The Day-14 follow-up: Meidan sends it himself from his own phone. */
export default async function SendFollowUp({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await getLead(id);
  if (!l) notFound();
  const first = l.name.split(" ")[0];
  const project = l.service.toLowerCase();
  const slot = "2–4";
  const text = `Hi ${first}, it's Meidan from MD Golden Builders. Quick heads-up — one of our projects near you got pushed back because of a permit, so I have a crew available for the next couple of weeks. Because of that, I can save you some money on your ${project} if we can start soon. I'm free tomorrow between ${slot} — I can stop by and explain everything. The only thing is timing, since I need to keep the guys busy. Would that work for you?`;
  const phone = l.phone.replace(/[^0-9]/g, "");
  const days = l.estimateSentAt ? -daysFrom(l.estimateSentAt, TODAY) : 14;

  return (
    <>
      <BackLink href="/follow-ups" label="Follow-ups" />
      <h1 className="text-2xl font-bold tracking-tight">Message {first}</h1>
      <div className="mb-4 mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>{l.service} · {l.city}</span>
        <SourceBadge source={l.source} />
        <span>· estimate {l.estimateAmount ? money(l.estimateAmount) : ""} sent {l.estimateSentAt ? date(l.estimateSentAt) : ""} ({days} days ago)</span>
      </div>

      <Card className="max-w-xl p-4">
        <div className="mb-2 text-xs font-semibold text-muted">Day 14 · from you, from your phone</div>
        <div className="rounded-2xl rounded-br-sm bg-[#0a84ff] px-3.5 py-2.5 text-[15px] leading-relaxed text-white">{text}</div>
        <p className="mt-2 text-[11px] text-muted">“{slot}” is your next free window tomorrow. Change anything you like before sending.</p>

        <div className="mt-4 grid gap-2">
          <a href={`sms:+1${phone}&body=${encodeURIComponent(text)}`} className="gold-gradient flex items-center justify-center gap-2 rounded-xl py-3 text-base font-bold text-black">
            <MessageSquare className="size-5" /> Open in Messages
          </a>
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-medium"><Copy className="size-4" /> Copy text</button>
            <button className="flex items-center justify-center gap-1.5 rounded-xl bg-ok py-2.5 text-sm font-semibold text-white"><Check className="size-4" /> Sent</button>
          </div>
        </div>
      </Card>
    </>
  );
}
