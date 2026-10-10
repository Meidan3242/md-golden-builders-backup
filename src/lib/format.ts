const TZ = "America/Los_Angeles";

export const money = (n: number, cents = false) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents ? 2 : 0 });

export const compactMoney = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 10_000 ? `$${Math.round(n / 1000)}k` : money(n);

export const date = (s?: string) =>
  s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: TZ }) : "—";

export const dateLong = (s?: string) =>
  s ? new Date(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: TZ }) : "—";

export const time = (s: string) =>
  new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });

export const dateTime = (s: string) => `${date(s)}, ${time(s)}`;

export const duration = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

export const pct = (n: number) => `${Math.round(n * 100)}%`;

export function daysFrom(s: string, now: Date) {
  return Math.round((new Date(s).getTime() - now.getTime()) / 86_400_000);
}

/** Calendar day in San Diego time, for grouping ("2026-10-10"). */
export const dayKey = (s: string | Date) => new Date(s).toLocaleDateString("en-CA", { timeZone: TZ });
