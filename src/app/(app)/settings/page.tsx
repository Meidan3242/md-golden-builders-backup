import { redirect } from "next/navigation";
import { Avatar, Badge, Card, CardHeader, KeyValue, PageHeader } from "@/components/ui";
import { allUsers, currentUser } from "@/lib/data";

const ROLE_INFO = {
  admin: "Sees everything — all leads, projects, money and settings",
  office: "Sees everything incl. money; manages leads, calendar and documents",
  sales: "Sees only the leads and projects assigned to them",
};

export default async function SettingsPage() {
  const user = await currentUser();
  if (user.role !== "admin") redirect("/");
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-4 lg:grid-cols-2">
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
