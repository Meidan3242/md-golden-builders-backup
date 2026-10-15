import { ProjectsMap, type MapPoint } from "@/components/projects-map";
import { PageHeader } from "@/components/ui";
import { canSeeMoney, currentUser, getLeads, getProjects, projectsReal } from "@/lib/data";
import { PAST_JOBS, PROJECT_COORDS } from "@/lib/demo-data";
import { compactMoney } from "@/lib/format";

export default async function MapPage() {
  const user = await currentUser();
  const showMoney = canSeeMoney(user);
  const [projects, leads] = await Promise.all([getProjects(), getLeads()]);
  const val = (n: number) => (showMoney ? compactMoney(n) : undefined);

  const real = await projectsReal();
  const points: MapPoint[] = [
    ...projects.filter((p) => !real || PROJECT_COORDS[p.id]).map((p) => ({
      id: p.id,
      kind: (p.stage === "Completed" ? "completed" : "active") as MapPoint["kind"],
      title: p.customer,
      subtitle: `${p.type} · ${p.stage}`,
      address: `${p.address}, ${p.city}`,
      lat: PROJECT_COORDS[p.id]?.[0] ?? 32.72,
      lng: PROJECT_COORDS[p.id]?.[1] ?? -117.16,
      value: val(p.contractValue),
      href: `/projects/${p.id}`,
      photos: p.media.slice(0, 6).map((m) => m.hue),
    })),
    ...(real ? [] : PAST_JOBS).map((j, i) => ({
      id: j.id,
      kind: "completed" as const,
      title: j.customer,
      subtitle: `${j.type} · completed ${j.year}`,
      address: j.city,
      lat: j.lat,
      lng: j.lng,
      value: val(j.value),
      photos: [0, 1, 2].map((k) => (i * 61 + k * 40) % 360),
    })),
    ...leads
      .filter((l) => ["Estimate Sent", "Second Meeting", "New", "Trying to Reach", "Appointment Set"].includes(l.stage) && l.lat)
      .map((l) => ({
        id: l.id,
        kind: (l.stage === "Estimate Sent" || l.stage === "Second Meeting" ? "estimate" : "lead") as MapPoint["kind"],
        title: l.name,
        subtitle: `${l.service} · ${l.stage}`,
        address: `${l.address}, ${l.city}`,
        lat: l.lat!,
        lng: l.lng!,
        value: l.estimateAmount ? val(l.estimateAmount) : undefined,
        href: `/leads/${l.id}`,
      })),
  ];

  return (
    <>
      <PageHeader title="Map" subtitle="Every project, estimate and lead — Chula Vista to Fallbrook, the coast to Julian" />
      {real && <p className="mb-3 rounded-xl bg-warn-soft px-4 py-2 text-sm text-warn">Coming soon: pins for your real projects and leads (the app needs to turn each address into a map point first).</p>}
      <ProjectsMap points={points} />
    </>
  );
}
