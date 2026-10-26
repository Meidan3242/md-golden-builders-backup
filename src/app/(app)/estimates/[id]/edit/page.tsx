import { notFound, redirect } from "next/navigation";
import { EstimateEditor } from "@/components/estimate-editor";
import { BackLink } from "@/components/ui";
import { canSeeAll, currentUser, getLead } from "@/lib/data";
import { estimateById } from "@/lib/estimates";

export default async function EditEstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const e = user.role === "pm" ? null : await estimateById(id);
  if (!e || (e.leadId ? !(await getLead(e.leadId)) : !canSeeAll(user))) notFound();
  if (e.status === "Approved") redirect(`/estimates/${id}`);
  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href={`/estimates/${id}`} label={`Estimate #${e.number}`} />
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Edit estimate #{e.number}</h1>
      <EstimateEditor initial={{ id: e.id, leadId: e.leadId ?? "", customer: e.customer, title: e.title, note: e.note, jobs: e.jobs, exclusions: e.exclusions, schedule: e.schedule, validDays: e.validDays }} />
    </div>
  );
}
