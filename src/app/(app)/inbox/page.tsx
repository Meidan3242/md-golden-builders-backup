import { Mail, MessageSquare, Phone } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";

export default function InboxPage() {
  return (
    <>
      <PageHeader title="Inbox" subtitle="Coming in Phase 3 — answer every lead from one place" />
      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: MessageSquare, t: "SMS from the business number", d: "Through RingCentral — the same number the office already uses." },
            { icon: Mail, t: "Email", d: "Replies land on the lead or project automatically." },
            { icon: Phone, t: "Calls & recordings", d: "Every call recorded and attached to the right customer." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-lg border border-border p-4">
              <Icon className="size-5 text-gold-text" />
              <div className="mt-2 text-sm font-semibold">{t}</div>
              <div className="mt-1 text-xs text-muted">{d}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">Thumbtack, Yelp and Meta messages will be connected where their platforms allow it.</p>
      </Card>
    </>
  );
}
