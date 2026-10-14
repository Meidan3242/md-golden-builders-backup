import { CHANNELS, type Channel } from "./demo-data";
import { dayKey } from "./format";
import type { Lead } from "./types";

type ChannelMonth = { leads: number; estimates: number; sold: number; soldValue: number };
export type MonthStats = { month: string; channels: Record<Channel, ChannelMonth> };

const channelOf = (l: Lead): Channel => (l.source === "Google" || l.source === "Yelp" || l.source === "Thumbtack" ? l.source : "Other");
const hadEstimate = (l: Lead) => !!l.estimateSentAt || (l.estimateAmount ?? 0) > 0 || ["Estimate Sent", "Second Meeting", "Won"].includes(l.stage);

/** Real numbers per month and channel, counted from the leads themselves (month = when the lead came in, San Diego time). */
export function monthlyStats(leads: Lead[], months: string[]): MonthStats[] {
  const empty = () => Object.fromEntries(CHANNELS.map((c) => [c, { leads: 0, estimates: 0, sold: 0, soldValue: 0 }])) as Record<Channel, ChannelMonth>;
  const by = new Map(months.map((m) => [m, empty()]));
  for (const l of leads) {
    const row = by.get(dayKey(l.createdAt).slice(0, 7));
    if (!row) continue;
    const c = row[channelOf(l)];
    c.leads++;
    if (hadEstimate(l)) c.estimates++;
    if (l.stage === "Won") {
      c.sold++;
      c.soldValue += l.estimateAmount ?? 0;
    }
  }
  return months.map((m) => ({ month: m, channels: by.get(m)! }));
}

/** "YYYY-MM" list: Jan → this month for the current year, Jan → Dec for a past year. */
export function monthsOfYear(year: number, today: Date) {
  const nowKey = dayKey(today.toISOString()).slice(0, 7);
  const last = String(year) === nowKey.slice(0, 4) ? Number(nowKey.slice(5)) : 12;
  return Array.from({ length: last }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
}

/** The last n months ending with this month. */
export function lastMonths(n: number, today: Date) {
  const [y, m] = dayKey(today.toISOString()).slice(0, 7).split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}
