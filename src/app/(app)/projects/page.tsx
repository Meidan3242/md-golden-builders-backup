import { FolderOpen, Hammer, Map as MapIcon, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectStageBadge } from "@/components/status";
import { BackLink, Card, Progress, Tile } from "@/components/ui";
import { canSeeMoney, currentUser, getProjects, projectFinancials } from "@/lib/data";
import { compactMoney, date } from "@/lib/format";
import type { Project } from "@/lib/types";

const PAGE_SIZE = 10;

const LISTS: Record<string, { title: string; hint: string; match: (p: Project) => boolean }> = {
  ongoing: { title: "Ongoing projects", hint: "Everything signed and not finished — including jobs waiting on a permit", match: (p) => p.stage !== "Completed" },
  all: { title: "All projects", hint: "Ongoing and completed, newest first", match: () => true },
};

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ box?: string; page?: string }> }) {
  const sp = await searchParams;
  const user = await currentUser();
  const showMoney = canSeeMoney(user);
  const projects = await getProjects();

  if (sp.box) {
    const b = LISTS[sp.box];
    if (!b) notFound();
    const rows = projects.filter(b.match).sort((a, z) => z.signedAt.localeCompare(a.signedAt));
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
    return (
      <>
        <BackLink href="/projects" label="Projects" />
        <h1 className="text-2xl font-bold tracking-tight">{b.title} <span className="text-muted">{rows.length}</span></h1>
        <p className="mb-4 text-sm text-muted">{b.hint}</p>
        {rows.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((p) => <ProjectCard key={p.id} p={p} showMoney={showMoney} />)}
          </div>
        ) : (
          <Card className="p-8 text-center text-sm text-muted">Nothing here right now</Card>
        )}
        {pages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1">
            {Array.from({ length: pages }, (_, i) => (
              <Link key={i} href={`/projects?box=${sp.box}&page=${i + 1}`} className={i + 1 === page ? "gold-gradient rounded-lg px-3 py-1 text-sm font-bold text-black" : "rounded-lg border border-border px-3 py-1 text-sm"}>{i + 1}</Link>
            ))}
          </div>
        )}
      </>
    );
  }

  const ongoing = projects.filter(LISTS.ongoing.match);
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Projects</h1>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/projects/new" className="gold-gradient flex flex-col justify-center rounded-2xl p-4 text-black shadow-sm">
          <Plus className="size-7" />
          <div className="mt-1 text-lg font-bold">New project</div>
          <div className="text-xs opacity-80">Customer gets the welcome email right away</div>
        </Link>
        <Tile href="/map" icon={<MapIcon />} title="Map" hint="Every job, street by street" />
        <Tile href="/projects?box=ongoing" icon={<Hammer />} title="Ongoing projects" count={ongoing.length} hint="Working now + waiting on permit" tone="gold">
          <ul className="mt-3 space-y-1 border-t border-border pt-2 text-xs">
            {ongoing.slice(0, 4).map((p) => <li key={p.id} className="truncate"><b>{p.customer}</b> <span className="text-muted">· {p.stage === "Waiting on Permit" ? "permit" : p.type}</span></li>)}
            {ongoing.length > 4 && <li className="text-muted">+{ongoing.length - 4} more</li>}
          </ul>
        </Tile>
        <Tile href="/projects?box=all" icon={<FolderOpen />} title="All projects" count={projects.length} hint={`${projects.length - ongoing.length} completed · 10 per page`} />
      </div>
    </>
  );
}

function ProjectCard({ p, showMoney }: { p: Project; showMoney: boolean }) {
  const f = projectFinancials(p);
  return (
    <Link href={`/projects/${p.id}`}>
      <Card className="h-full p-4 transition hover:border-gold">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold">{p.customer}</div>
            <div className="text-xs text-muted">{p.type} · {p.city} · #{p.number}</div>
          </div>
          <ProjectStageBadge stage={p.stage} />
        </div>
        {showMoney && (
          <>
            <div className="mt-3 flex justify-between text-xs"><span className="text-muted">Paid</span><span><b>{compactMoney(f.collected)}</b> of {compactMoney(f.revenue)}</span></div>
            <Progress value={f.collected / f.revenue} className="mt-1" />
          </>
        )}
        <div className="mt-2 text-[11px] text-muted">Signed {date(p.signedAt)} · {p.changeOrders.length + 1} contract{p.changeOrders.length ? "s" : ""}</div>
      </Card>
    </Link>
  );
}
