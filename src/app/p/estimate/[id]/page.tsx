import { CustomerDoc } from "@/components/customer-doc";
import { DEMO_ESTIMATE as E } from "@/lib/demo-docs";

export const metadata = { title: `Estimate #${E.number} — MD Golden Builders` };

export default function EstimatePage() {
  return (
    <CustomerDoc
      kind="Estimate"
      number={E.number}
      date={E.date}
      subline={`Valid until ${E.validUntil}`}
      customer={E.customer}
      title={E.title}
      note={E.note}
      sections={E.sections}
      exclusions={E.exclusions}
      total={E.base}
      schedule={E.schedule}
      withDeposit
      warranty={E.warranty}
      signHref="/p/pay/demo?from=estimate"
    />
  );
}
