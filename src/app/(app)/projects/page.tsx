import { CheckCircle2, FilePen, FileSignature, FolderOpen, Hammer, Landmark, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectStageBadge } from "@/components/status";
import { BackLink, Card, Progress, Tile } from "@/components/ui";
import { canSeeMoney, currentUser, getProjects, projectFinancials } from "@/lib/data";
import { compactMoney, date } from "@/lib/format";
import type { Project } from "@/lib/types";

const PAGE_SIZE = 10;

/** Boxes from top to bottom: what's new, what's running, what's waiting on the city, the rest. */
const BOXES: { key: string; title: string; hint: string; icon: React.ReactNode; match: (p: Project) => boolean; tone?: "gold" | "ok" | "bad" }[] = [
  { key: "new", title: "New", hint: "Just signed — not started", icon: <Sparkles />, match: (p) => p.stage === "Contract Signed", tone: "gold" },
  { key: "running", title: "In progress", hint: "Crew on site", icon: <Hammer />, match: (p) => p.stage === "Scheduled" || p.stage === "In Progress" },
  { key: "permit", title: "Waiting on permit", hint: "Plans at the city", icon: <Landmark />, match: (p) => p.stage === "Waiting on Permit" },
  { key: "finishing", title: "Finishing up", hint: "Final inspection & last items", icon: <FileSignature />, match: (p) => p.stage === "Final Inspection" || p.stage === "Punch List" },
  { key: "co-unsigned", title: "Change orders to sign", hint: "Sent, customer didn't sign yet", icon: <FilePen />, match: (p) => p.changeOrders.some((c) => c.status !== "Signed"), tone: "bad" },
  { key: "done", title: "Completed", hint: "Finished jobs", icon: <CheckCircle2 />, match: (p) => p.stage === "Completed", tone: "ok" },
];

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ box?: string; page?: string }> }) {
  const sp = await searchParams;
  const user = await currentUser();
  const showMoney = canSeeMoney(user);
  const projects = await getProjects();

  if (sp.box) {
    const b = sp.box === "all" ? { title: "All projects", hint: "Newest first", match: () => true } : BOXES.find((x) => x.key === sp.box);
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

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Projects</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BOXES.map((b) => {
          const items = projects.filter(b.match);
          return (
            <Tile key={b.key} href={`/projects?box=${b.key}`} icon={b.icon} title={b.title} count={items.length} hint={b.hint} tone={items.length ? b.tone : undefined}>
              {items.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-border pt-2 text-xs">
                  {items.slice(0, 3).map((p) => <li key={p.id} className="truncate"><b>{p.customer}</b> <span className="text-muted">· {p.type}</span></li>)}
                  {items.length > 3 && <li className="text-muted">+{items.length - 3} more</li>}
                </ul>
              )}
            </Tile>
          );
        })}
        <Tile href="/projects?box=all" icon={<FolderOpen />} title="All projects" count={projects.length} hint="Newest first, 10 per page" />
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
