import { Mic } from "lucide-react";
import { Button, Card, CardHeader, PageHeader } from "@/components/ui";
import { allUsers } from "@/lib/data";
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

export default function NewLead() {
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
            <select className={input}>{allUsers().filter((u) => u.role !== "office").map((u) => <option key={u.id}>{u.name}</option>)}</select>
          </Field>
          <Field label="Site visit (optional)"><input type="datetime-local" className={input} /></Field>
          <Field label="Call recording">
            <div className={`${input} flex items-center gap-2 text-muted`}><Mic className="size-4" /> Auto-attached from RingCentral</div>
          </Field>
          <Field label="Notes" wide><textarea className={input} rows={3} placeholder="What does the customer want? Budget, timing, gate code…" /></Field>
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
