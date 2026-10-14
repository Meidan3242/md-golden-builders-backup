import { redirect } from "next/navigation";
import { Avatar, Badge, Card, CardHeader, KeyValue, PageHeader } from "@/components/ui";
import { Database } from "lucide-react";
import { DbSetupButton } from "@/components/db-setup";
import { dbConfigured } from "@/lib/clock";
import { allUsers, currentUser, getLeads } from "@/lib/data";
import { schemaVersion } from "@/lib/db";
import { MIGRATIONS } from "@/lib/migrations";
import { storageReady } from "@/lib/storage";

const ROLE_INFO = {
  admin: "Sees everything — all leads, projects, money and settings",
  office: "Sees everything incl. money; manages leads, calendar and documents",
  sales: "Sees only the leads and projects assigned to them",
  pm: "Sees only active projects (and their calendar) — no leads, no money",
};

export default async function SettingsPage() {
  const user = await currentUser();
  if (user.role !== "admin") redirect("/");
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-4 lg:grid-cols-2">
        <DatabaseCard />
        <Card>
          <CardHeader title="Users & roles" />
          <ul className="divide-y divide-border">
            {allUsers().map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar initials={u.initials} className="size-8 text-xs" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{u.name}</div>
                  <div className="text-xs text-muted">{ROLE_INFO[u.role]}</div>
                </div>
                <Badge tone={u.role === "admin" ? "gold" : "neutral"}>{u.title}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Company" />
          <div className="p-4">
            <KeyValue
              items={[
                ["Name", "MD Golden Builders"],
                ["CSLB License", "#1128874"],
                ["Address", "4275 Mission Bay Dr #359, San Diego, CA 92109"],
                ["Phone", "858-933-1694"],
                ["Email", "info@mdgoldenbuilders.com"],
                ["Business line (RingCentral)", "(858) 332-2168"],
                ["Google reviews", "tr.ee/xLG1j2NoRY"],
                ["Yelp reviews", "tr.ee/ffZ0n6Xp5-"],
                ["Thumbtack reviews", "tr.ee/kiBOFNYW8q"],
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Templates" />
          <ul className="divide-y divide-border text-sm">
            {["Home Improvement Contract (Form 203) — e-sign fields", "Additional Description (scope + payment schedule)", "Change order", "Subcontractor agreement", "Welcome email", "Completion form + warranty (1 / 5 years)", "Appointment confirmation SMS", "Follow-up texts (Day 1 / 3 / 7 / 14 / 30)"].map((t) => (
              <li key={t} className="px-4 py-2.5">{t}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Integrations" />
          <ul className="divide-y divide-border text-sm">
            {[
              ["monday.com", "Import + parallel run"],
              ["RingCentral", "Call recordings, SMS"],
              ["Square", "Card payments"],
              ["Google Calendar", "Appointments"],
              ["Joist", "Estimate PDFs"],
              ["Google / Yelp / Thumbtack / Meta", "Incoming leads"],
            ].map(([n, d]) => (
              <li key={n} className="flex items-center justify-between px-4 py-2.5">
                <span><span className="font-medium">{n}</span> <span className="text-muted">· {d}</span></span>
                <Badge>Not connected</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

/** Real data: is the database connected and set up? */
async function DatabaseCard() {
  const configured = dbConfigured();
  const version = await schemaVersion();
  const latest = Math.max(...MIGRATIONS.map((m) => m.version));
  const ready = (version ?? 0) >= 1;
  const leads = ready ? (await getLeads()).length : 0;
  return (
    <Card className="lg:col-span-2">
      <CardHeader title={<span className="flex items-center gap-2"><Database className="size-4 text-gold-text" /> Database (real data)</span>} />
      <div className="space-y-3 p-4 text-sm">
        <ul className="space-y-1">
          <li>{configured ? "✅" : "⬜"} Supabase connected to Vercel</li>
          <li>{version === null && configured ? "⚠️ Can't reach the database — check the Supabase connection" : ready ? "✅" : "⬜"} Tables created{ready ? ` (version ${version})` : ""}</li>
          <li>{storageReady() ? "✅" : "⬜"} File storage (estimate PDFs)</li>
          <li>{ready ? `✅ Leads are real now — ${leads} in the database` : "⬜ Leads still show demo data"}</li>
        </ul>
        {configured && version !== null && <DbSetupButton label={!ready ? "Set up database" : (version ?? 0) < latest ? "Update database" : "Check database"} />}
        {!configured && <p className="text-xs text-muted">Vercel → md-golden-builders → Storage → Create database → Supabase → connect to this project, then redeploy.</p>}
      </div>
    </Card>
  );
}
