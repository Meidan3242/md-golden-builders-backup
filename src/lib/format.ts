const TZ = "America/Los_Angeles";
// Built once and reused — creating a formatter on every call is ~50× slower (calendars format thousands of dates).
const F = {
  money0: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
  money2: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }),
  date: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: TZ }),
  dateLong: new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: TZ }),
  time: new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ }),
  day: new Intl.DateTimeFormat("en-CA", { timeZone: TZ }),
};
const ok = (d: Date) => !Number.isNaN(d.getTime());

export const money = (n: number, cents = false) =>
  (cents ? F.money2 : F.money0).format(n);

export const compactMoney = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 10_000 ? `$${Math.round(n / 1000)}k` : money(n);

export const date = (s?: string) =>
  s && ok(new Date(s)) ? F.date.format(new Date(s)) : "—";

export const dateLong = (s?: string) =>
  s && ok(new Date(s)) ? F.dateLong.format(new Date(s)) : "—";

export const time = (s: string) =>
  ok(new Date(s)) ? F.time.format(new Date(s)) : "";

export const dateTime = (s: string) => `${date(s)}, ${time(s)}`;

export const duration = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

export const pct = (n: number) => `${Math.round(n * 100)}%`;

export function daysFrom(s: string, now: Date) {
  return Math.round((new Date(s).getTime() - now.getTime()) / 86_400_000);
}

/** Calendar day in San Diego time, for grouping ("2026-10-10"). */
export const dayKey = (s: string | Date) => (ok(new Date(s)) ? F.day.format(new Date(s)) : "");
