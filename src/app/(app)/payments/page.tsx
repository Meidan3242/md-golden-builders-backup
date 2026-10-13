import Link from "next/link";
import { redirect } from "next/navigation";
import { PayStatusBadge, WaiverBadge } from "@/components/status";
import { Card, CardHeader, PageHeader, Stat } from "@/components/ui";
import { canSeeMoney, currentUser, getProjects, subById } from "@/lib/data";
import { date, money } from "@/lib/format";

export default async function PaymentsPage() {
  const user = await currentUser();
  if (!canSeeMoney(user)) redirect("/");
  const projects = await getProjects();

  const incoming = projects.flatMap((p) => [
    ...p.milestones.map((m) => ({ p, m, label: "Contract" })),
    ...p.changeOrders.filter((c) => c.status === "Signed").flatMap((c) => c.milestones.map((m) => ({ p, m, label: `CO #${c.number}` }))),
  ]);
  const outgoing = projects.flatMap((p) =>
    [...p.subs, ...p.changeOrders.flatMap((c) => c.subs)].flatMap((a) => a.payments.map((pay) => ({ p, a, pay }))),
  );
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const awaiting = incoming.filter((x) => x.m.status === "Invoiced" || x.m.status === "Overdue");
  const received = incoming.filter((x) => x.m.status === "Paid");
  const subReq = outgoing.filter((x) => x.pay.status === "Requested");
  const subPaid = outgoing.filter((x) => x.pay.status === "Paid");

  return (
    <>
      <PageHeader title="Payments" subtitle="Money in from customers (Square, ACH, Zelle, check) and money out to subcontractors — every payment documented." />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Waiting from customers" value={money(sum(awaiting.map((x) => x.m.amount)))} hint={`${awaiting.length} invoices sent`} tone="gold" />
        <Stat label="Received (all time)" value={money(sum(received.map((x) => x.m.amount)))} tone="ok" />
        <Stat label="Subs requesting payment" value={money(sum(subReq.map((x) => x.pay.amount)))} hint={`${subReq.length} requests`} tone="bad" />
        <Stat label="Paid to subs" value={money(sum(subPaid.map((x) => x.pay.amount)))} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-x-auto">
          <CardHeader title="Customer payments" subtitle="Invoiced first, then upcoming" />
          <table className="w-full min-w-[560px] text-sm">
            <tbody className="divide-y divide-border">
              {[...awaiting, ...incoming.filter((x) => x.m.status === "Upcoming"), ...received].slice(0, 18).map(({ p, m, label }) => (
                <tr key={p.id + label + m.id}>
                  <td className="px-4 py-2.5"><Link href={`/projects/${p.id}?tab=payments`} className="font-medium hover:underline">{p.customer}</Link><div className="text-xs text-muted">{label} · {m.name}</div></td>
                  <td className="px-4 py-2.5"><PayStatusBadge status={m.status} /></td>
                  <td className="px-4 py-2.5 text-xs text-muted">{m.paidAt ? `${date(m.paidAt)} · ${m.method}` : m.dueDate ? `Due ${date(m.dueDate)}` : ""}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{money(m.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="scroll-mt-4 overflow-x-auto" id="subs">
          <CardHeader title="Subcontractor payments" subtitle="Collect a conditional waiver before paying, unconditional after" />
          <table className="w-full min-w-[620px] text-sm">
            <tbody className="divide-y divide-border">
              {[...subReq, ...subPaid, ...outgoing.filter((x) => x.pay.status === "Upcoming")].slice(0, 18).map(({ p, a, pay }) => (
                <tr key={a.id + pay.id}>
                  <td className="px-4 py-2.5"><span className="font-medium">{subById(a.subId)?.company}</span><div className="text-xs text-muted"><Link href={`/projects/${p.id}?tab=subs`} className="hover:underline">{p.customer}</Link> · {pay.name}</div></td>
                  <td className="px-4 py-2.5"><PayStatusBadge status={pay.status} /></td>
                  <td className="px-4 py-2.5"><WaiverBadge w={pay.lienWaiver} /></td>
                  <td className="px-4 py-2.5 text-right font-semibold">{money(pay.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
