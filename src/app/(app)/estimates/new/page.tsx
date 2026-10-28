import { notFound } from "next/navigation";
import { EstimateEditor, type ClientOption } from "@/components/estimate-editor";
import { BackLink } from "@/components/ui";
import { canSeeAll, currentUser, getLeads, getProjects } from "@/lib/data";
import { ESTIMATE_TEMPLATES, templateJob } from "@/lib/estimate-templates";

/** An estimate on its own — not tied to a lead or a project (owner / office). */
export default async function NewStandaloneEstimatePage() {
  const user = await currentUser();
  if (!canSeeAll(user)) notFound();
  const t = ESTIMATE_TEMPLATES.find((x) => x.key === "blank")!;
  const [leads, projects] = await Promise.all([getLeads(), getProjects()]);
  const place = (address: string, city: string) => (city && !address.includes(city) ? [address, city].filter(Boolean).join(", ") : address);
  // Choosing a lead links the estimate to it (it shows on the lead, follow-ups start when sent); a project customer only fills the details.
  const clients: ClientOption[] = [
    ...leads.map((l) => ({ key: `L-${l.id}`, kind: "Lead" as const, leadId: l.id, note: l.service, customer: { name: l.name, phone: l.phone, email: l.email ?? "", address: place(l.address, l.city) } })),
    ...projects.map((p) => ({ key: `P-${p.id}`, kind: "Project" as const, note: p.type, customer: { name: p.customer, phone: p.phone, email: p.email ?? "", address: place(p.address, p.city) } })),
  ];
  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/estimates" label="Estimates" />
      <h1 className="mb-4 text-2xl font-bold tracking-tight">New estimate</h1>
      <EstimateEditor
        clients={clients}
        initial={{
          leadId: "",
          customer: { name: "", email: "", phone: "", address: "" },
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
