import { ProjectsMap, type MapPoint } from "@/components/projects-map";
import { MapPinsFinder } from "@/components/map-pins-finder";
import { PageHeader } from "@/components/ui";
import { schemaVersion, sql } from "@/lib/db";
import { canSeeMoney, currentUser, getLeads, getProjects, projectsReal } from "@/lib/data";
import { PAST_JOBS, PROJECT_COORDS } from "@/lib/demo-data";
import { compactMoney } from "@/lib/format";

export default async function MapPage() {
  const user = await currentUser();
  const showMoney = canSeeMoney(user);
  const [projects, leads] = await Promise.all([getProjects(), getLeads()]);
  const val = (n: number) => (showMoney ? compactMoney(n) : undefined);

  const real = await projectsReal();
  // Projects whose address hasn't been looked up yet (geo_status empty) vs. looked up but not found.
  const geo = real && ((await schemaVersion()) ?? 0) >= 7 ? (await sql()`select count(*) filter (where geo_status is null)::int as missing, count(*) filter (where geo_status = 'none')::int as nopin from projects`)[0] : null;
  const missing = real ? (geo ? geo.missing : projects.length) : 0;
  const noPin = geo?.nopin ?? 0;
  const points: MapPoint[] = [
    ...projects.filter((p) => (real ? p.lat != null : true)).map((p) => ({
      id: p.id,
      kind: (p.stage === "Completed" ? "completed" : "active") as MapPoint["kind"],
      title: p.customer,
      subtitle: `${p.type} · ${p.stage}`,
      address: p.city && !p.address.includes(p.city) ? `${p.address}, ${p.city}` : p.address,
      lat: p.lat ?? PROJECT_COORDS[p.id]?.[0] ?? 32.72,
      lng: p.lng ?? PROJECT_COORDS[p.id]?.[1] ?? -117.16,
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
      {real && missing > 0 && <MapPinsFinder missing={missing} />}
      {real && noPin > 0 && !missing && <p className="mb-3 text-xs text-muted">{noPin} project{noPin === 1 ? "" : "s"} without a pin (no address in monday, or the address wasn&apos;t found).</p>}
      <ProjectsMap points={points} />
    </>
  );
}
