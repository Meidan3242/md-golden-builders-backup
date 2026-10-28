import { paymentRows } from "./estimate-math";
import type { Estimate } from "./estimates";
import { dateLong } from "./format";

/**
 * Everything the customer's estimate shows — one source for the staff preview, the customer's page and the PDF,
 * so the three can never differ.
 */
export function estimateDoc(e: Estimate) {
  const issued = e.sentAt ?? e.createdAt;
  return {
    number: e.number,
    date: dateLong(issued),
    validUntil: dateLong(new Date(new Date(issued).getTime() + e.validDays * 86_400_000).toISOString()),
    customer: e.customer,
    title: e.title,
    note: e.note,
    jobs: e.jobs,
    exclusions: e.exclusions,
    total: e.total,
    rows: paymentRows(e.total, e.schedule),
  };
}
export type EstimateDoc = ReturnType<typeof estimateDoc>;
