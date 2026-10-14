import { Mic } from "lucide-react";
import { Button, Card, CardHeader, PageHeader } from "@/components/ui";
import { WeekPicker, type Busy } from "@/components/week-picker";
import { allUsers, getAppointments } from "@/lib/data";
import { TODAY } from "@/lib/demo-data";
import { dayKey } from "@/lib/format";
import { LEAD_SOURCES } from "@/lib/types";

const input = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-gold";

function Field({ label, required, children, wide }: { label: string; required?: boolean; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? "sm:col-span-2" : undefined}>
      <span className="mb-1 block text-xs font-medium text-muted">{label}{required && <span className="text-bad"> *</span>}</span>
      {children}
    </label>
  );
}

export default async function NewLead() {
  // Next 7 days, with what's already booked — so the visit is set while looking at the week.
  const appts = await getAppointments();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(TODAY.getTime() + (i + 1) * 86_400_000);
    return {
      key: dayKey(d.toISOString()),
      label: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/Los_Angeles" }),
      sub: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Los_Angeles" }),
    };
  });
  const hourLA = (iso: string) => Number(new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hour12: false }));
  const busy: Busy[] = appts.map((a) => ({ day: dayKey(a.start), hour: hourLA(a.start), label: a.title.split(" — ")[1] ?? a.title }));
  const now = new Date(TODAY.getTime() - 7 * 3_600_000).toISOString().slice(0, 16); // San Diego local time

  return (
    <>
      <PageHeader title="New lead" subtitle="Quick form for the office — takes under a minute while on the phone" />
      <Card className="max-w-3xl">
        <CardHeader title="Customer" />
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Full name" required><input className={input} placeholder="Jane Smith" /></Field>
          <Field label="Phone" required><input className={input} placeholder="(619) 555-0100" /></Field>
          <Field label="Email"><input className={input} placeholder="jane@email.com" /></Field>
          <Field label="Lead source" required>
            <select className={input} defaultValue="">
              <option value="" disabled>Where did they find us?</option>
              {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Property address" required wide><input className={input} placeholder="Street, City, ZIP" /></Field>
          <Field label="Requested service" required>
            <select className={input}>
              {["Kitchen Remodel", "Bathroom Remodel", "ADU Construction", "Room Addition", "Full Home Remodel", "Retaining Wall", "Garage Conversion", "Flooring Installation", "Patio / Deck", "Other"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Assign to">
            <select className={input}>{allUsers().filter((u) => u.role === "admin" || u.role === "sales").map((u) => <option key={u.id}>{u.name}</option>)}</select>
          </Field>
          <Field label="Came in (date & time)"><input type="datetime-local" defaultValue={now} className={input} /></Field>
          <Field label="Call recording">
            <div className={`${input} flex items-center gap-2 text-muted`}><Mic className="size-4" /> Auto-attached from RingCentral</div>
          </Field>
          <Field label="Notes" wide><textarea className={input} rows={3} placeholder="What does the customer want? Budget, timing, gate code…" /></Field>
        </div>
        <div className="border-t border-border p-4">
          <div className="mb-1 text-sm font-semibold">Book the visit — next 7 days</div>
          <p className="mb-2 text-xs text-muted">Grey = already booked. Tap a free hour.</p>
          <WeekPicker days={days} busy={busy} />
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button href="/leads">Cancel</Button>
          <Button variant="primary">Save lead</Button>
        </div>
      </Card>
      <p className="mt-3 text-xs text-muted">Prototype: saving is enabled once the database is connected. Duplicate phone numbers will be flagged automatically.</p>
    </>
  );
}
