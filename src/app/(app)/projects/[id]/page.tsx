import clsx from "clsx";
import { AlertTriangle, Camera, Check, CheckCircle2, Circle, FilePlus2, FileSignature, Mail, Phone, Plus, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectChat } from "@/components/project-chat";
import { DocIcon, ExpensesTable, MediaGrid, MilestoneTable, SubAssignmentCard } from "@/components/project-parts";
import { ProjectStageBadge } from "@/components/status";
import { Avatar, Badge, Button, Card, CardHeader, Empty, KeyValue, Progress, Tabs } from "@/components/ui";
import { canSeeMoney, currentUser, getProject, projectAlerts, projectFinancials, userById } from "@/lib/data";
import { date, dateLong, dateTime, money, pct } from "@/lib/format";
import { PROJECT_STAGES, type Project } from "@/lib/types";

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;
  const p = await getProject(id);
  if (!p) notFound();
  const user = await currentUser();
  const showMoney = canSeeMoney(user);
  const f = projectFinancials(p);
  const stageIdx = PROJECT_STAGES.indexOf(p.stage);

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "chat", label: "Chat & updates", count: p.chat?.length ?? 0 },
    { key: "payments", label: "Customer payments", count: p.milestones.length },
    { key: "change-orders", label: "Change orders", count: p.changeOrders.length },
    ...(showMoney ? [{ key: "subs", label: "Subcontractors", count: p.subs.length }, { key: "expenses", label: "Expenses", count: p.expenses.length }] : []),
    { key: "permits", label: "Permits", count: p.permits.length },
    { key: "media", label: "Photos & videos", count: p.media.length },
    { key: "documents", label: "Documents", count: p.documents.length },
  ];

  return (
    <>
      <div className="mb-1 text-xs text-muted"><Link href="/projects" className="hover:underline">Projects</Link> / #{p.number}</div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{p.customer} <span className="font-normal text-muted">· {p.type}</span></h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <ProjectStageBadge stage={p.stage} />
            <span>{p.address}, {p.city}</span>
            <span>· <Link href={`/leads/${p.leadId}`} className="text-gold-text hover:underline">Original lead</Link></span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href={`tel:${p.phone}`}><Phone className="size-4" /> Call</Button>
          <Button><Camera className="size-4" /> Upload media</Button>
          <Button><FilePlus2 className="size-4" /> Change order</Button>
          {p.stage === "Punch List" || p.stage === "Completed" ? (
            <Button variant="primary"><FileSignature className="size-4" /> Send completion form</Button>
          ) : (
            <Button variant="primary"><Mail className="size-4" /> Send invoice</Button>
          )}
        </div>
      </div>

      {/* stage stepper */}
      <Card className="scrollbar-thin mb-5 overflow-x-auto p-3">
        <ol className="flex min-w-[720px] items-center">
          {PROJECT_STAGES.map((s, i) => (
            <li key={s} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1 text-center">
                <span className={clsx("flex size-6 items-center justify-center rounded-full text-[11px] font-bold", i < stageIdx ? "bg-ok text-white" : i === stageIdx ? "gold-gradient text-black" : "bg-surface text-muted")}>
                  {i < stageIdx ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className={clsx("text-[11px]", i === stageIdx ? "font-semibold" : "text-muted")}>{s}</span>
              </div>
              {i < PROJECT_STAGES.length - 1 && <div className={clsx("mx-1 h-0.5 flex-1 rounded", i < stageIdx ? "bg-ok" : "bg-border")} />}
            </li>
          ))}
        </ol>
      </Card>

      <Tabs tabs={tabs} active={tab} base={`/projects/${p.id}`} />

      {tab === "overview" && <Overview p={p} f={f} showMoney={showMoney} />}
      {tab === "chat" && <ProjectChat messages={p.chat ?? []} me={user.id} />}
      {tab === "payments" && <MilestoneTable milestones={p.milestones} />}
      {tab === "change-orders" && <ChangeOrders p={p} showMoney={showMoney} />}
      {tab === "subs" && showMoney && (
        <div className="space-y-4">
          {p.subs.map((a) => <SubAssignmentCard key={a.id} a={a} />)}
          {!p.subs.length && <Card><Empty>No subcontractors assigned yet</Empty></Card>}
          <Button><Plus className="size-4" /> Assign subcontractor</Button>
        </div>
      )}
      {tab === "expenses" && showMoney && <ExpensesTable expenses={p.expenses} />}
      {tab === "permits" && <Permits p={p} />}
      {tab === "media" && (
        <Card className="p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted">Internal gallery. Upload straight from your phone — no more WhatsApp groups.</p>
            <div className="flex gap-2"><Button>Share gallery with customer</Button><Button variant="primary"><Camera className="size-4" /> Upload</Button></div>
          </div>
          <MediaGrid media={p.media} />
        </Card>
      )}
      {tab === "documents" && <Documents p={p} />}
    </>
  );
}

function Overview({ p, f, showMoney }: { p: Project; f: ReturnType<typeof projectFinancials>; showMoney: boolean }) {
  const alerts = showMoney ? projectAlerts(p) : [];
  const has = (k: string) => p.documents.some((d) => d.kind === k);
  const checklist: [string, boolean][] = [
    ["Contract signed (Form 203 + Additional Description)", has("Contract")],
    ["Welcome email sent with contract & payment schedule", true],
    ["Permit approved", p.permits.length === 0 || p.permits.some((x) => x.status === "Approved" || x.status === "Finaled")],
    ["Before photos uploaded", p.media.some((m) => m.phase === "Before")],
    ["All subcontractor agreements signed", p.subs.every((s) => s.agreement === "Signed")],
    ["Completion form signed", has("Completion Form")],
    ["Warranty + review links sent", p.stage === "Completed"],
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        {showMoney && (
          <Card>
            <CardHeader title="Project financials" subtitle="Contract + signed change orders vs. subcontractors + expenses" />
            <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
              <div><div className="text-xs text-muted">Contract value</div><div className="text-xl font-bold">{money(f.revenue)}</div><div className="text-[11px] text-muted">{money(p.contractValue)} + COs</div></div>
              <div><div className="text-xs text-muted">Collected</div><div className="text-xl font-bold text-ok">{money(f.collected)}</div><div className="text-[11px] text-muted">Balance {money(f.balance)}</div></div>
              <div><div className="text-xs text-muted">Costs (subs + exp.)</div><div className="text-xl font-bold">{money(f.cost)}</div><div className="text-[11px] text-muted">Subs paid {money(f.subPaid)}</div></div>
              <div><div className="text-xs text-muted">Est. profit</div><div className="text-xl font-bold text-gold-text">{money(f.profit)}</div><div className="text-[11px] text-muted">{pct(f.margin)} margin</div></div>
            </div>
            <div className="px-4 pb-4">
              <div className="mb-1 flex justify-between text-[11px] text-muted"><span>Customer paid</span><span>{pct(f.collected / f.revenue)}</span></div>
              <Progress value={f.collected / f.revenue} />
            </div>
          </Card>
        )}

        <Card>
          <CardHeader title="Project checklist" subtitle="From signature to review request" />
          <ul className="divide-y divide-border">
            {checklist.map(([label, done]) => (
              <li key={label} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                {done ? <CheckCircle2 className="size-4 text-ok" /> : <Circle className="size-4 text-muted" />}
                <span className={done ? "text-muted" : "font-medium"}>{label}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Activity" />
          <ul className="space-y-3 p-4">
            {p.activity.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <Avatar initials={userById(a.by)?.initials ?? "?"} />
                <div><div>{a.text}</div><div className="text-xs text-muted">{dateTime(a.at)}</div></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="p-4">
          <KeyValue
            items={[
              ["Customer", p.customer],
              ["Phone", <a key="p" href={`tel:${p.phone}`} className="text-gold-text">{p.phone}</a>],
              ["Signed", dateLong(p.signedAt)],
              ["Start", p.startDate ? dateLong(p.startDate) : "Waiting on permit"],
              ["Target finish", dateLong(p.targetCompletion)],
              ["Warranty", p.warrantyYears ? `${p.warrantyYears} year${p.warrantyYears > 1 ? "s" : ""} workmanship` : "—"],
              ["Project lead", userById(p.assignedTo)?.name ?? "—"],
            ]}
          />
        </Card>
        {alerts.length > 0 && (
          <Card>
            <CardHeader title="Needs attention" />
            <ul className="divide-y divide-border">
              {alerts.map((a) => (
                <li key={a} className="flex gap-2 px-4 py-2 text-xs"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warn" />{a}</li>
              ))}
            </ul>
          </Card>
        )}
        <Card>
          <CardHeader title="Next customer payment" />
          {(() => {
            const next = p.milestones.find((m) => m.status !== "Paid");
            return next ? (
              <div className="p-4">
                <div className="text-sm font-medium">{next.name}</div>
                <div className="text-2xl font-bold">{money(next.amount)}</div>
                <div className="mt-1 text-xs text-muted">{next.status === "Invoiced" ? `Invoiced · due ${date(next.dueDate)}` : "Not invoiced yet"}</div>
                <div className="mt-3 flex gap-2"><Button variant="primary">Send Square link</Button><Button>Record Zelle/check</Button></div>
              </div>
            ) : (
              <Empty>Paid in full ✓</Empty>
            );
          })()}
        </Card>
        {p.stage === "Completed" && (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><Star className="size-4 fill-gold text-gold" /> Review request sent</div>
            <p className="mt-1 text-xs text-muted">Google · Yelp · Thumbtack links included in the completion email.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function ChangeOrders({ p, showMoney }: { p: Project; showMoney: boolean }) {
  if (!p.changeOrders.length)
    return (
      <Card>
        <Empty>
          No change orders yet. A change order is a mini-project: its own scope, signature, customer payments, subcontractors and costs.
          <div className="mt-3"><Button variant="primary"><FilePlus2 className="size-4" /> New change order</Button></div>
        </Empty>
      </Card>
    );
  return (
    <div className="space-y-6">
      {p.changeOrders.map((co) => (
        <section key={co.id} className="rounded-xl border-2 border-gold/40 p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gold-text">Change order #{co.number}</div>
              <div className="text-lg font-bold">{co.title}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={co.status === "Signed" ? "ok" : co.status === "Sent" ? "warn" : "neutral"}>{co.status}{co.signedAt ? ` · ${date(co.signedAt)}` : ""}</Badge>
              <span className="text-lg font-bold">{money(co.amount)}</span>
            </div>
          </div>
          <div className="space-y-4">
            <MilestoneTable milestones={co.milestones} title="Customer payments — this change order" />
            {showMoney && co.subs.map((a) => <SubAssignmentCard key={a.id} a={a} />)}
            {showMoney && co.expenses.length > 0 && <ExpensesTable expenses={co.expenses} />}
          </div>
        </section>
      ))}
    </div>
  );
}

function Permits({ p }: { p: Project }) {
  if (!p.permits.length) return <Card><Empty>No permit required for this project</Empty></Card>;
  return (
    <div className="space-y-4">
      {p.permits.map((pm) => (
        <Card key={pm.id}>
          <CardHeader
            title={`${pm.jurisdiction} — ${pm.type}`}
            subtitle={pm.number ? `Permit # ${pm.number}` : "Not issued yet"}
            action={<Badge tone={pm.status === "Approved" || pm.status === "Finaled" ? "ok" : pm.status === "Corrections" ? "bad" : "warn"}>{pm.status}</Badge>}
          />
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <KeyValue items={[["Submitted", date(pm.submittedAt)], ["Approved", date(pm.approvedAt)], ["Fees", pm.fee ? money(pm.fee) : "—"]]} />
            <div>
              <div className="mb-2 text-xs font-semibold text-muted">Inspections</div>
              <ul className="space-y-1.5">
                {pm.inspections.map((i) => (
                  <li key={i.name} className="flex items-center justify-between text-sm">
                    <span>{i.name}</span>
                    <span className="flex items-center gap-2 text-xs text-muted">{date(i.date)} {i.result && <Badge tone={i.result === "Passed" ? "ok" : i.result === "Failed" ? "bad" : "gold"}>{i.result}</Badge>}</span>
                  </li>
                ))}
                {!pm.inspections.length && <li className="text-xs text-muted">Inspections are added after the permit is issued</li>}
              </ul>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Documents({ p }: { p: Project }) {
  return (
    <Card>
      <CardHeader title="Documents" action={<button className="text-xs font-medium text-gold-text">+ Upload</button>} />
      <ul className="divide-y divide-border">
        {p.documents.map((d) => (
          <li key={d.id} className="flex items-center gap-3 px-4 py-2.5">
            <DocIcon />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{d.name}</div>
              <div className="text-xs text-muted">{d.kind} · {date(d.at)}</div>
            </div>
            {d.signed && <Badge tone="ok">E-signed</Badge>}
          </li>
        ))}
      </ul>
    </Card>
  );
}
