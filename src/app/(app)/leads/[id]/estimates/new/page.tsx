import { notFound } from "next/navigation";
import { EstimateEditor } from "@/components/estimate-editor";
import { BackLink } from "@/components/ui";
import { currentUser, getLead } from "@/lib/data";
import { ESTIMATE_TEMPLATES, templateJob } from "@/lib/estimate-templates";

/** New estimate for this lead — customer details filled in, a template suggested from the service they asked for. */
export default async function NewEstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const lead = user.role === "pm" ? undefined : await getLead(id);
  if (!lead) notFound();
  const service = lead.service.toLowerCase();
  const suggested = ESTIMATE_TEMPLATES.find((t) => t.key !== "blank" && (service.includes(t.label.toLowerCase().split(" ")[0]) || t.label.toLowerCase().includes(service.split(" ")[0])));
  const t = suggested ?? ESTIMATE_TEMPLATES.find((x) => x.key === "blank")!;
  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href={`/leads/${lead.id}`} label={lead.name} />
      <h1 className="mb-4 text-2xl font-bold tracking-tight">New estimate</h1>
      <EstimateEditor
        suggested={t.key}
        initial={{
          leadId: lead.id,
          customer: { name: lead.name, email: lead.email ?? "", phone: lead.phone, address: lead.city && !lead.address.includes(lead.city) ? [lead.address, lead.city].filter(Boolean).join(", ") : lead.address },
          title: t.title,
          note: "Thank you for having me over. Below is everything we talked about — the scope, the price and the payment schedule. Any question, just text me.",
          jobs: [templateJob(t)],
          exclusions: [...t.exclusions],
          schedule: t.schedule.map((s) => ({ ...s })),
          validDays: 30,
        }}
      />
    </div>
  );
}
