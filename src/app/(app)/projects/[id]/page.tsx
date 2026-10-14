import clsx from "clsx";
import { AlertTriangle, Camera, Check, CheckCircle2, Circle, FilePlus2, FileSignature, HandCoins, MessageSquare, Plus, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectChat } from "@/components/project-chat";
import { DocIcon, MediaGrid, MilestoneTable, SubAssignmentCard } from "@/components/project-parts";
import { ProjectStageBadge } from "@/components/status";
import { Avatar, Badge, Button, Card, CardHeader, Collapse, Empty, KeyValue, Progress, Tabs } from "@/components/ui";
import { canSeeProjectMoney, contractsOf, currentUser, getProject, projectAlerts, projectFinancials, subById, userById, type ContractView } from "@/lib/data";
import { date, dateLong, dateTime, money, pct } from "@/lib/format";
import { PROJECT_STAGES, type Project } from "@/lib/types";

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;
  const p = await getProject(id);
  if (!p) notFound();
  const user = await currentUser();
  const showMoney = canSeeProjectMoney(user);
  const f = projectFinancials(p);
  const stageIdx = PROJECT_STAGES.indexOf(p.stage);
  const contracts = contractsOf(p);

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "chat", label: "✦ Chat", count: p.chat?.length ?? 0 },
    { key: "contracts", label: "Contracts", count: contracts.length },
    ...(showMoney ? [{ key: "payments", label: "Customer payments" }] : []),
    ...(showMoney ? [{ key: "subs", label: "Subcontractors", count: contracts.reduce((a, c) => a + c.subs.length, 0) }, { key: "expenses", label: "Expenses" }] : []),
    { key: "permits", label: "Permits", count: p.permits.length },
    { key: "media", label: "Photos & videos", count: p.media.length },
    { key: "documents", label: "Documents", count: p.documents.length },
  ];

  return (
    <>
      <div className="mb-1 text-xs text-muted"><Link href="/projects" className="hover:underline">Projects</Link> / #{p.number}</div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{p.customer} <span className="font-normal text-muted">· {p.type}</span></h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <ProjectStageBadge stage={p.stage} />
            <span>{p.address}, {p.city}</span>
            {user.role !== "pm" && <span>· <Link href={`/leads/${p.leadId}`} className="text-gold-text hover:underline">Original lead</Link></span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button><MessageSquare className="size-4" /><span className="hidden sm:inline"> Text</span></Button>
          <Button><Camera className="size-4" /><span className="hidden sm:inline"> Upload media</span></Button>
          <Button><FilePlus2 className="size-4" /><span className="hidden sm:inline"> Change order</span></Button>
          {p.stage === "Punch List" || p.stage === "Completed" ? (
            <Button variant="primary"><FileSignature className="size-4" /> <span className="hidden sm:inline">Send </span>completion form</Button>
          ) : (
            <Button variant="primary"><HandCoins className="size-4" /> Request payment</Button>
          )}
        </div>
      </div>

      {/* stage stepper */}
      <div className="mb-4 flex items-center gap-2 text-xs text-muted md:hidden">
        <span className="gold-gradient flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-black">{stageIdx + 1}</span>
        Stage {stageIdx + 1} of {PROJECT_STAGES.length} · <b className="text-text">{p.stage}</b> · next: {PROJECT_STAGES[stageIdx + 1] ?? "—"}
      </div>
      <Card className="scrollbar-thin mb-5 hidden overflow-x-auto p-3 md:block">
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

      {tab === "overview" && (
        <div className="space-y-4">
          <ProjectChat messages={p.chat ?? []} me={user.id} limit={2} moreHref={`/projects/${p.id}?tab=chat`} />
          <Overview p={p} f={f} showMoney={showMoney} />
        </div>
      )}
      {tab === "chat" && <ProjectChat messages={p.chat ?? []} me={user.id} />}
      {tab === "contracts" && <Contracts contracts={contracts} showMoney={showMoney} />}
      {tab === "payments" && showMoney && <PaymentsByContract contracts={contracts} />}
      {tab === "subs" && showMoney && <SubsByContract contracts={contracts} />}
      {tab === "expenses" && showMoney && <ExpensesByContract contracts={contracts} />}
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
    ["Welcome email sent (contract, scope, license, payments)", true],
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
              ["Phone", p.phone],
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
        {showMoney && <Card>
          <CardHeader title="Next customer payment" />
          {(() => {
            const next = p.milestones.find((m) => m.status !== "Paid");
            return next ? (
              <div className="p-4">
                <div className="text-sm font-medium">{next.name}</div>
                <div className="text-2xl font-bold">{money(next.amount)}</div>
                <div className="mt-1 text-xs text-muted">{next.status === "Invoiced" ? `Requested · due ${date(next.dueDate)}` : "Not requested yet"}</div>
                <div className="mt-3 flex flex-wrap gap-2"><Button variant="primary">Request payment</Button><Button>Payment received</Button></div>
                <p className="mt-2 text-[11px] text-muted">Mark it received with the check photo / Zelle screenshot → the customer gets a receipt by email + text automatically. <Link href="/p/receipt/demo" className="text-gold-text hover:underline">See the receipt</Link></p>
              </div>
            ) : (
              <Empty>Paid in full ✓</Empty>
            );
          })()}
        </Card>}
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

/** One line per contract: "Contract #1 · Original contract · $85,760 · Signed". */
function ContractTitle({ c, extra }: { c: ContractView; extra?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <span className="font-bold">{c.label}</span>
      <span className="text-xs text-muted">{c.kind} · {c.title}</span>
      {c.status !== "Signed" && <Badge tone="warn">Not signed yet</Badge>}
      {extra}
    </div>
  );
}

function Contracts({ contracts, showMoney }: { contracts: ContractView[]; showMoney: boolean }) {
  return (
    <div className="space-y-3">
      {contracts.map((c, i) => {
        const paid = c.milestones.filter((m) => m.status === "Paid").reduce((a, m) => a + m.amount, 0);
        return (
          <Collapse key={c.n} open={i === 0} title={<ContractTitle c={c} />} right={showMoney && <span className="font-bold">{money(c.amount)}</span>}>
            <KeyValue
              items={[
                ["Status", c.status === "Signed" ? `Signed ${date(c.signedAt)}` : c.status],
                ["Customer paid", showMoney ? `${money(paid)} of ${money(c.amount)}` : "—"],
                ["Payments", `${c.milestones.length} steps`],
                ["Subcontractors", c.subs.map((s) => subById(s.subId)?.company).join(", ") || "—"],
              ]}
            />
            <div className="flex flex-wrap gap-2"><Button>View signed PDF</Button>{c.status !== "Signed" && <Button variant="primary">Resend for signature</Button>}</div>
          </Collapse>
        );
      })}
      <Button variant="primary"><FilePlus2 className="size-4" /> New change order (Contract #{contracts.length + 1})</Button>
    </div>
  );
}

function PaymentsByContract({ contracts }: { contracts: ContractView[] }) {
  const all = contracts.flatMap((c) => c.milestones);
  const paid = all.filter((m) => m.status === "Paid").reduce((a, m) => a + m.amount, 0);
  const total = all.reduce((a, m) => a + m.amount, 0);
  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap items-center gap-x-6 gap-y-1 p-4 text-sm">
        <span>All contracts: <b>{money(total)}</b></span>
        <span className="text-ok">Paid <b>{money(paid)}</b></span>
        <span>Left <b>{money(total - paid)}</b></span>
      </Card>
      {contracts.map((c, i) => {
        const cp = c.milestones.filter((m) => m.status === "Paid").reduce((a, m) => a + m.amount, 0);
        return (
          <Collapse key={c.n} open={i === 0} title={<ContractTitle c={c} />} right={<span className="text-xs text-muted"><b className="text-text">{money(cp)}</b> / {money(c.amount)}</span>}>
            <MilestoneTable milestones={c.milestones} title={`Payments — ${c.label}`} />
          </Collapse>
        );
      })}
    </div>
  );
}

function SubsByContract({ contracts }: { contracts: ContractView[] }) {
  return (
    <div className="space-y-3">
      {contracts.map((c, i) => (
        <Collapse key={c.n} open={i === 0} title={<ContractTitle c={c} />} right={<span className="text-xs text-muted">{c.subs.length} sub{c.subs.length === 1 ? "" : "s"}</span>}>
          {c.subs.map((a) => <SubAssignmentCard key={a.id} a={a} />)}
          {!c.subs.length && <div className="py-4 text-center text-xs text-muted">No subcontractors on this contract</div>}
          <button className="text-xs font-medium text-gold-text"><Plus className="inline size-3.5" /> Add a sub to {c.label}</button>
        </Collapse>
      ))}
    </div>
  );
}

/** Everything that went out on the project: sub payments + materials and other expenses, per contract. */
function ExpensesByContract({ contracts }: { contracts: ContractView[] }) {
  const rowsOf = (c: ContractView) =>
    [
      ...c.subs.flatMap((a) =>
        a.payments.filter((x) => x.status !== "Upcoming").map((x) => ({
          id: x.id, at: x.paidAt, to: subById(a.subId)?.company ?? "Sub", what: `Sub · ${x.name}`, amount: x.amount, proof: x.proof, requested: x.status === "Requested",
        })),
      ),
      ...c.expenses.map((e) => ({ id: e.id, at: e.date, to: e.vendor, what: e.category, amount: e.amount, proof: e.receipt, requested: false })),
    ].sort((a, z) => (z.at ?? "9").localeCompare(a.at ?? "9"));
  const all = contracts.flatMap(rowsOf).filter((r) => !r.requested);
  const subs = all.filter((r) => r.what.startsWith("Sub")).reduce((a, r) => a + r.amount, 0);
  const other = all.reduce((a, r) => a + r.amount, 0) - subs;
  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap items-center gap-x-6 gap-y-1 p-4 text-sm">
        <span>Subs paid <b>{money(subs)}</b></span>
        <span>Materials & other <b>{money(other)}</b></span>
        <span>Total out <b>{money(subs + other)}</b></span>
        <button className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-gold-text"><Camera className="size-3.5" /> Snap receipt</button>
      </Card>
      {contracts.map((c, i) => {
        const rows = rowsOf(c);
        const out = rows.filter((r) => !r.requested).reduce((a, r) => a + r.amount, 0);
        return (
          <Collapse key={c.n} open={i === 0} title={<ContractTitle c={c} />} right={<span className="text-xs text-muted">Out <b className="text-text">{money(out)}</b></span>}>
            {rows.length ? (
              <>
              <ul className="divide-y divide-border sm:hidden">
                {rows.map((r) => (
                  <li key={r.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{r.to}</span>
                      <span className="font-semibold">{money(r.amount)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                      {r.at ? date(r.at) : ""}
                      <Badge tone={r.what.startsWith("Sub") ? "info" : "neutral"}>{r.what}</Badge>
                      {r.requested ? <Badge tone="warn">Requested — not paid</Badge> : r.proof ? <span className="text-ok">receipt ✓</span> : <Badge tone="bad">No receipt</Badge>}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="text-left text-xs text-muted">
                    <tr className="border-b border-border"><th className="px-3 py-2 font-medium">Date</th><th className="px-3 py-2 font-medium">Paid to</th><th className="px-3 py-2 font-medium">What</th><th className="px-3 py-2 font-medium">Proof</th><th className="px-3 py-2 text-right font-medium">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2 text-muted">{r.at ? date(r.at) : "—"}</td>
                        <td className="px-3 py-2 font-medium">{r.to}</td>
                        <td className="px-3 py-2"><Badge tone={r.what.startsWith("Sub") ? "info" : "neutral"}>{r.what}</Badge>{r.requested && <Badge tone="warn">Requested — not paid</Badge>}</td>
                        <td className="px-3 py-2">{r.requested ? <span className="text-xs text-muted">—</span> : r.proof ? <span className="text-xs text-ok">✓ Attached</span> : <Badge tone="bad">Missing</Badge>}</td>
                        <td className="px-3 py-2 text-right font-semibold">{money(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            ) : (
              <div className="py-4 text-center text-xs text-muted">Nothing paid out on this contract yet</div>
            )}
          </Collapse>
        );
      })}
    </div>
  );
}
