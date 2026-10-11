import { CustomerDoc } from "@/components/customer-doc";
import { DEMO_CHANGE_ORDER as CO } from "@/lib/demo-docs";
import { money } from "@/lib/format";

export const metadata = { title: `Change Order #${CO.number} — MD Golden Builders` };

export default function ChangeOrderPage() {
  const original = 85760;
  return (
    <CustomerDoc
      kind="Change Order"
      number={CO.number}
      date={CO.date}
      subline={CO.contractRef}
      customer={CO.customer}
      title={CO.title}
      note={CO.note}
      sections={CO.sections}
      exclusions={CO.exclusions}
      total={CO.base}
      schedule={CO.schedule}
      withDeposit={false}
      signHref="/p/sign/demo?page=1"
      extra={
        <section className="rounded-2xl border border-border bg-card p-5 text-sm">
          <h2 className="mb-2 text-lg font-bold">How this changes your contract</h2>
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-muted">Original contract</span><span>{money(original)}</span></div>
            <div className="flex justify-between"><span className="text-muted">This change order</span><span className="font-semibold text-ok">+{money(CO.base)}</span></div>
            <div className="flex justify-between border-t border-border pt-1.5 font-bold"><span>New contract total</span><span>{money(original + CO.base)}</span></div>
            <div className="flex justify-between text-xs text-muted"><span>Schedule impact</span><span>+{CO.daysAdded} working days</span></div>
          </div>
        </section>
      }
    />
  );
}
