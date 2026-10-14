import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ConfirmBadge } from "@/components/status";
import { Avatar, Button, Card } from "@/components/ui";
import { currentUser, getAppointments, userById } from "@/lib/data";
import { now } from "@/lib/clock";
import { dateLong, dayKey, time } from "@/lib/format";
import type { Appointment } from "@/lib/types";

const TYPE_COLOR: Record<Appointment["type"], string> = {
  "Site Visit": "bg-info-soft text-info",
  "Second Meeting": "bg-gold-soft text-gold-text",
  Inspection: "bg-ok-soft text-ok",
  "Project Meeting": "bg-surface text-text",
};
const DOT: Record<Appointment["type"], string> = { "Site Visit": "bg-info", "Second Meeting": "bg-gold", Inspection: "bg-ok", "Project Meeting": "bg-muted" };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string; day?: string }> }) {
  const sp = await searchParams;
  const todayKey = dayKey(now());
  const [y, m] = (sp.m ?? todayKey.slice(0, 7)).split("-").map(Number);
  const monthKey = `${y}-${String(m).padStart(2, "0")}`;
  const first = new Date(Date.UTC(y, m - 1, 1, 19)); // noon in San Diego
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = first.getUTCDay();
  const cells = Array.from({ length: Math.ceil((lead + daysInMonth) / 7) * 7 }, (_, i) => {
    const d = i - lead + 1;
    return d >= 1 && d <= daysInMonth ? `${monthKey}-${String(d).padStart(2, "0")}` : null;
  });
  const shift = (n: number) => { const d = new Date(Date.UTC(y, m - 1 + n, 1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`; };
  const selected = sp.day ?? (todayKey.startsWith(monthKey) ? todayKey : `${monthKey}-01`);

  const [appts, user] = await Promise.all([getAppointments(), currentUser()]);
  const on = (k: string) => appts.filter((a) => dayKey(a.start) === k);
  const dayItems = on(selected);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/calendar?m=${shift(-1)}`} className="rounded-lg border border-border p-1.5 hover:bg-surface" aria-label="Previous month"><ChevronLeft className="size-4" /></Link>
          <h1 className="min-w-44 text-center text-2xl font-bold tracking-tight">{first.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}</h1>
          <Link href={`/calendar?m=${shift(1)}`} className="rounded-lg border border-border p-1.5 hover:bg-surface" aria-label="Next month"><ChevronRight className="size-4" /></Link>
          <Link href="/calendar" className="ml-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-surface">Today</Link>
        </div>
        <div className="flex gap-2">
          {user.role !== "pm" && <Button href="/leads/new">+ New lead</Button>}
          <Button variant="primary">+ New appointment</Button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted">
        {(Object.keys(DOT) as Appointment["type"][]).map((t) => <span key={t} className="flex items-center gap-1.5"><span className={clsx("size-2 rounded-full", DOT[t])} />{t}</span>)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border bg-surface text-center text-[11px] font-semibold text-muted">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((k, i) => {
              const items = k ? on(k) : [];
              return (
                <div key={i} className={clsx("min-h-16 border-b border-r border-border sm:min-h-28", i % 7 === 6 && "border-r-0", !k && "bg-surface/50")}>
                  {k && (
                    <Link href={`/calendar?m=${monthKey}&day=${k}`} className={clsx("block h-full p-1 hover:bg-surface sm:p-1.5", k === selected && "bg-gold-soft/50")}>
                      <span className={clsx("inline-flex size-6 items-center justify-center rounded-full text-xs", k === todayKey ? "gold-gradient font-bold text-black" : "text-muted")}>{Number(k.slice(8))}</span>
                      {/* phone: dots · desktop: names */}
                      <div className="mt-0.5 flex flex-wrap gap-0.5 sm:hidden">{items.map((a) => <span key={a.id} className={clsx("size-1.5 rounded-full", DOT[a.type])} />)}</div>
                      <div className="mt-0.5 hidden space-y-0.5 sm:block">
                        {items.slice(0, 3).map((a) => (
                          <div key={a.id} className={clsx("truncate rounded px-1 py-0.5 text-[10px] font-medium", TYPE_COLOR[a.type])}>{time(a.start)} {a.title.split(" — ")[1] ?? a.title}</div>
                        ))}
                        {items.length > 3 && <div className="px-1 text-[10px] text-muted">+{items.length - 3} more</div>}
                      </div>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-semibold">{selected === todayKey ? "Today · " : ""}{dateLong(new Date(`${selected}T19:00:00Z`).toISOString())}</h2>
          </div>
          <ul className="divide-y divide-border">
            {dayItems.map((a) => {
              const u = userById(a.assignedTo);
              return (
                <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="w-14 shrink-0 text-sm font-semibold">{time(a.start)}</span>
                  <div className="min-w-0 flex-1">
                    <Link href={a.leadId ? `/leads/${a.leadId}` : `/projects/${a.projectId}`} className="text-sm font-medium hover:underline">{a.title}</Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={clsx("rounded px-1.5 py-0.5 text-[10px] font-medium", TYPE_COLOR[a.type])}>{a.type}</span>
                      <ConfirmBadge c={a.confirmation} />
                    </div>
                  </div>
                  {u && <Avatar initials={u.initials} />}
                </li>
              );
            })}
            {!dayItems.length && <li className="px-4 py-8 text-center text-sm text-muted">Nothing on this day</li>}
          </ul>
          <div className="border-t border-border px-4 py-2.5 text-[11px] text-muted">Customers get a text the day before: reply 1 to confirm, 2 to reschedule.</div>
        </Card>
      </div>
    </>
  );
}
