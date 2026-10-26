import { notFound } from "next/navigation";
import { EstimateEditor } from "@/components/estimate-editor";
import { BackLink } from "@/components/ui";
import { canSeeAll, currentUser } from "@/lib/data";
import { ESTIMATE_TEMPLATES, templateJob } from "@/lib/estimate-templates";

/** An estimate on its own — not tied to a lead or a project (owner / office). */
export default async function NewStandaloneEstimatePage() {
  const user = await currentUser();
  if (!canSeeAll(user)) notFound();
  const t = ESTIMATE_TEMPLATES.find((x) => x.key === "blank")!;
  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/estimates" label="Estimates" />
      <h1 className="mb-4 text-2xl font-bold tracking-tight">New estimate</h1>
      <EstimateEditor
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
