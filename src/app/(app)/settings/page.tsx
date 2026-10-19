import { redirect } from "next/navigation";
import { Avatar, Badge, Card, CardHeader, KeyValue, PageHeader } from "@/components/ui";
import { Database } from "lucide-react";
import { DbSetupButton } from "@/components/db-setup";
import { MondayImportButton } from "@/components/monday-import";
import { mondayReady } from "@/lib/monday";
import { dbConfigured } from "@/lib/clock";
import { allUsers, currentUser, getLeads } from "@/lib/data";
import { schemaVersion } from "@/lib/db";
import { MIGRATIONS } from "@/lib/migrations";
import { r2Ready, storageReady } from "@/lib/storage";
import { DiagnoseButton, StorageTestButton } from "@/components/storage-test";
import { LogOutEverywhereButton, PasswordForm } from "@/components/password-form";
import { ACCOUNTS, findAccount } from "@/lib/accounts";

const ROLE_INFO = {
  admin: "Sees everything — all leads, projects, money and settings",
  office: "Sees everything incl. money; manages leads, calendar and documents",
  sales: "Sees only the leads and projects assigned to them",
  pm: "Sees only active projects (with all their money) and their calendar — no leads",
};

export const maxDuration = 60; // monday import can take a little while

export default async function SettingsPage() {
  const user = await currentUser();
  if (user.role !== "admin") redirect("/");
  const logins = await Promise.all(
    Object.entries(ACCOUNTS).map(async ([email, id]) => ({ email, user: allUsers().find((u) => u.id === id)!, hasAccount: !!(await findAccount(email).catch(() => null)) })),
  );
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-4 lg:grid-cols-2">
        <DatabaseCard />
        <MondayCard />
        <Card>
          <CardHeader title="Logins" subtitle="Only these two emails can log in" />
          <ul className="divide-y divide-border">
            {logins.map((l) => (
              <li key={l.user.id} className="space-y-3 px-4 py-4">
                <div className="flex items-center gap-3">
                  <Avatar initials={l.user.initials} className="size-8 text-xs" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{l.user.name}</div>
                    <div className="truncate text-xs text-muted">{l.email} · {ROLE_INFO[l.user.role]}</div>
                  </div>
                  <Badge tone={l.hasAccount ? "ok" : "warn"}>{l.hasAccount ? "Own password" : "Old password"}</Badge>
                </div>
                <PasswordForm user={l.user.id} askCurrent={l.user.id === user.id && l.hasAccount} label={l.user.id === user.id ? "Set my password" : `Set ${l.user.name}'s password`} />
                {l.user.id !== user.id && <LogOutEverywhereButton user={l.user.id} name={l.user.name} />}
              </li>
            ))}
            <li className="px-4 py-3 text-xs text-muted">Sales rep and project manager: no login.</li>
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
          <li>{storageReady() ? "✅" : "⬜"} File storage (estimate PDFs){r2Ready() ? " — Cloudflare R2" : " — Supabase (add the 4 R2_ keys in Vercel to move to Cloudflare)"}</li>
          <li>{ready ? `✅ Leads are real now — ${leads} in the database` : "⬜ Leads still show demo data"}</li>
        </ul>
        {r2Ready() && <StorageTestButton />}
        {configured && version !== null && <DiagnoseButton />}
        {configured && version !== null && <DbSetupButton label={!ready ? "Set up database" : (version ?? 0) < latest ? "Update database" : "Check database"} />}
        {!configured && <p className="text-xs text-muted">Vercel → md-golden-builders → Storage → Create database → Supabase → connect to this project, then redeploy.</p>}
      </div>
    </Card>
  );
}

const MONDAY_BOARDS = [
  { id: "18393480229", label: "Import LEADS 2026" },
  { id: "9085250401", label: "Import LEADS 2025" },
];

/** Bring the leads over from monday. Can be pressed again any time — it updates instead of duplicating. */
async function MondayCard() {
  const ready = (await schemaVersion() ?? 0) >= 1;
  const token = mondayReady();
  return (
    <Card className="lg:col-span-2">
      <CardHeader title="Import from monday" subtitle="Leads boards → the app. Run again any time to bring in new rows (updates, never duplicates)." />
      <div className="space-y-3 p-4 text-sm">
        <ul className="space-y-1">
          <li>{token ? "✅" : "⬜"} monday connected (MONDAY_API_TOKEN in Vercel)</li>
          <li>{ready ? "✅" : "⬜"} Database ready</li>
        </ul>
        {token && ready ? (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">{MONDAY_BOARDS.map((b) => <MondayImportButton key={b.id} boardId={b.id} label={b.label} />)}</div>
            <div>
              <div className="mb-1 text-xs font-semibold text-muted">Clients → projects (Clients 2026 + 2025, and each client&apos;s own board: contract, change orders, payments, expenses)</div>
              <MondayImportButton clients label="Import clients" />
            </div>
            {r2Ready() && (
              <div>
                <div className="mb-1 text-xs font-semibold text-muted">Files → Cloudflare (contracts, PDFs, photos, receipts from each client — keeps going by itself until all are in)</div>
                <MondayImportButton files label="Copy files from monday" />
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted">monday → your picture (top right) → Developers → My access tokens → Copy. Then Vercel → Environment Variables → MONDAY_API_TOKEN → Save → Redeploy.</p>
        )}
      </div>
    </Card>
  );
}
