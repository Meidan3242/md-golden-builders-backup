import Link from "next/link";
import { ProjectStageBadge } from "@/components/status";
import { Card, PageHeader, Progress } from "@/components/ui";
import { canSeeMoney, currentUser, getProjects, projectFinancials, userById } from "@/lib/data";
import { compactMoney, date, pct } from "@/lib/format";
import { PROJECT_STAGES } from "@/lib/types";

export default async function ProjectsPage() {
  const user = await currentUser();
  const showMoney = canSeeMoney(user);
  const projects = await getProjects();

  return (
    <>
      <PageHeader title="Projects" subtitle={user.role === "sales" ? "Only the projects assigned to you" : `${projects.length} projects`} />

      <div className="scrollbar-thin mb-5 flex gap-2 overflow-x-auto pb-1">
        {PROJECT_STAGES.map((s) => {
          const n = projects.filter((p) => p.stage === s).length;
          return (
            <div key={s} className="min-w-32 shrink-0 rounded-lg border border-border bg-card px-3 py-2">
              <div className="text-[11px] text-muted">{s}</div>
              <div className="text-lg font-bold">{n}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => {
          const f = projectFinancials(p);
          return (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="h-full p-4 transition hover:border-gold">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-medium text-muted">#{p.number}</div>
                    <div className="font-semibold">{p.customer}</div>
                    <div className="text-xs text-muted">{p.type} · {p.city}</div>
                  </div>
                  <ProjectStageBadge stage={p.stage} />
                </div>
                {showMoney && (
                  <>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div><div className="text-[11px] text-muted">Contract</div><div className="text-sm font-bold">{compactMoney(f.revenue)}</div></div>
                      <div><div className="text-[11px] text-muted">Collected</div><div className="text-sm font-bold text-ok">{compactMoney(f.collected)}</div></div>
                      <div><div className="text-[11px] text-muted">Est. margin</div><div className="text-sm font-bold text-gold-text">{pct(f.margin)}</div></div>
                    </div>
                    <Progress value={f.collected / f.revenue} className="mt-3" />
                  </>
                )}
                <div className="mt-3 flex justify-between text-[11px] text-muted">
                  <span>Signed {date(p.signedAt)}{p.changeOrders.length ? ` · ${p.changeOrders.length} change order${p.changeOrders.length > 1 ? "s" : ""}` : ""}</span>
                  <span>{userById(p.assignedTo)?.name}</span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
