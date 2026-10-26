import type { EstimateJob, EstimateStage } from "./estimate-templates";

/** California: the deposit can't be more than $1,000 or 10% of the price, whichever is less. */
export const depositFor = (total: number) => Math.min(1000, Math.round(total * 0.1));
export const totalOf = (jobs: EstimateJob[]) => jobs.reduce((a, x) => a + (Number(x.price) || 0), 0);

/** Deposit first, then each stage as a % of what's left (last stage takes the rounding). */
export function paymentRows(total: number, stages: EstimateStage[]) {
  const deposit = depositFor(total);
  const rest = total - deposit;
  let used = 0;
  const rows = stages.map((s, i) => {
    const amount = i === stages.length - 1 ? rest - used : Math.round((rest * s.pct) / 100);
    used += amount;
    return { name: s.name, amount };
  });
  return [{ name: "Deposit (on approval)", amount: deposit }, ...rows];
}
