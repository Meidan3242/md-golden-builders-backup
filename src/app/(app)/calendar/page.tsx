import { MessageSquareText } from "lucide-react";
import Link from "next/link";
import { ConfirmBadge } from "@/components/status";
import { Avatar, Badge, Button, Card, PageHeader } from "@/components/ui";
import { getAppointments, userById } from "@/lib/data";
import { TODAY } from "@/lib/demo-data";
import { dateLong, dayKey, time } from "@/lib/format";

export default async function CalendarPage() {
  const appts = await getAppointments();
  const days = Array.from({ length: 7 }, (_, i) => new Date(TODAY.getTime() + i * 86_400_000));

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Site visits, second meetings and inspections. Syncs with Google Calendar."
        actions={<Button variant="primary">+ New appointment</Button>}
      />

      <Card className="mb-4 flex items-start gap-3 border-gold/40 bg-gold-soft p-4">
        <MessageSquareText className="mt-0.5 size-5 shrink-0 text-gold-text" />
        <div className="text-sm">
          <div className="font-semibold">Automatic confirmation SMS — sent the day before every appointment</div>
          <div className="mt-1 text-muted">
            “Hi Sarah, this is MD Golden Builders. Reminder: we’re meeting tomorrow, Tue Oct 13 at 10:00 AM at 1234 Garnet Ave. Reply <b>1</b> to confirm or <b>2</b> to reschedule.”
          </div>
          <div className="mt-1 text-xs text-muted">No reply by 6 PM → the office gets an alert to call the customer.</div>
        </div>
      </Card>

      <div className="space-y-4">
        {days.map((d) => {
          const items = appts.filter((a) => dayKey(a.start) === dayKey(d));
          return (
            <div key={d.toISOString()}>
              <h2 className="mb-2 text-sm font-semibold">{dayKey(d) === dayKey(TODAY) ? "Today · " : ""}{dateLong(d.toISOString())}</h2>
              {items.length ? (
                <Card>
                  <ul className="divide-y divide-border">
                    {items.map((a) => {
                      const u = userById(a.assignedTo);
                      return (
                        <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                          <span className="w-16 text-sm font-semibold">{time(a.start)}</span>
                          <div className="min-w-0 flex-1">
                            <Link href={a.leadId ? `/leads/${a.leadId}` : `/projects/${a.projectId}`} className="text-sm font-medium hover:underline">{a.title}</Link>
                            <div className="text-xs text-muted">{a.durationMin} min</div>
                          </div>
                          <Badge tone={a.type === "Second Meeting" ? "gold" : a.type === "Inspection" ? "info" : "neutral"}>{a.type}</Badge>
                          <ConfirmBadge c={a.confirmation} />
                          {u && <Avatar initials={u.initials} />}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              ) : (
                <div className="rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted">No appointments</div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
