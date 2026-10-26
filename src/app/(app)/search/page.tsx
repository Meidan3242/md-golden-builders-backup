import { FolderKanban, ReceiptText, Search, Users } from "lucide-react";
import Link from "next/link";
import { LeadStageBadge } from "@/components/status";
import { Badge, Card, CardHeader, Empty } from "@/components/ui";
import { canSeeAll, currentUser, getLeads, getProjects } from "@/lib/data";
import { allEstimates } from "@/lib/estimates";
import { date } from "@/lib/format";

const digits = (s?: string) => (s ?? "").replace(/\D/g, "");

/** One search over leads, projects and estimates — name, phone, email, address, job or number. */
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);
  const user = await currentUser();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const qDigits = digits(q);
  // Every word must match somewhere; a phone number matches however it's typed (619-555… / (619) 555…).
  const hit = (fields: (string | undefined)[], phones: (string | undefined)[] = []) => {
    if (!words.length) return false;
    if (qDigits.length >= 4 && qDigits.length === q.replace(/[\s()+.-]/g, "").length && phones.some((p) => digits(p).includes(qDigits))) return true;
    const text = fields.filter(Boolean).join(" ").toLowerCase();
    return words.every((w) => text.includes(w));
  };

  const [leads, projects, estimates] = q ? await Promise.all([getLeads(), getProjects(), user.role === "pm" ? [] : allEstimates()]) : [[], [], []];
  const leadIds = new Set(leads.map((l) => l.id));
  const L = leads.filter((l) => hit([l.name, l.phone, l.email, l.address, l.city, l.service, l.source, l.notes], [l.phone])).slice(0, 50);
  const P = projects.filter((p) => hit([p.id, p.customer, p.phone, p.email, p.address, p.city, p.type], [p.phone])).slice(0, 50);
  const E = estimates
    .filter((e) => canSeeAll(user) || (e.leadId && leadIds.has(e.leadId)))
    .filter((e) => hit([`#${e.number}`, String(e.number), e.customer.name, e.customer.phone, e.customer.email, e.customer.address, e.title], [e.customer.phone]))
    .slice(0, 50);
  const total = L.length + P.length + E.length;

  return (
    <div className="mx-auto max-w-3xl">
      <form action="/search" className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
        <Search className="size-4 text-muted" />
        <input name="q" defaultValue={q} autoFocus placeholder="Search leads, projects, estimates, phone numbers…" className="min-w-0 flex-1 bg-transparent py-0.5 text-base outline-none" />
        <button className="gold-gradient rounded-lg px-3 py-1 text-sm font-semibold text-black">Search</button>
      </form>

      {!q ? (
        <p className="text-sm text-muted">Type a name, phone number, email, address, job or estimate number.</p>
      ) : !total ? (
        <Card><Empty>Nothing found for “{q}”.</Empty></Card>
      ) : (
        <div className="space-y-4">
          {L.length > 0 && (
            <Card>
              <CardHeader title={`Leads · ${L.length}`} action={<Users className="size-4 text-muted" />} />
              <ul className="divide-y divide-border">
                {L.map((l) => (
                  <li key={l.id}>
                    <Link href={`/leads/${l.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 hover:bg-surface">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{l.name} <span className="font-normal text-muted">· {l.service}{l.city ? ` · ${l.city}` : ""}</span></span>
                      <span className="text-xs text-muted">{l.phone}</span>
                      <LeadStageBadge stage={l.stage} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {P.length > 0 && (
            <Card>
              <CardHeader title={`Projects · ${P.length}`} action={<FolderKanban className="size-4 text-muted" />} />
              <ul className="divide-y divide-border">
                {P.map((p) => (
                  <li key={p.id}>
                    <Link href={`/projects/${p.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 hover:bg-surface">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.customer} <span className="font-normal text-muted">· {p.type}{p.city ? ` · ${p.city}` : ""}</span></span>
                      <span className="text-xs text-muted">{p.phone}</span>
                      <Badge>{p.stage}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {E.length > 0 && (
            <Card>
              <CardHeader title={`Estimates · ${E.length}`} action={<ReceiptText className="size-4 text-muted" />} />
              <ul className="divide-y divide-border">
                {E.map((e) => (
                  <li key={e.id}>
                    <Link href={`/estimates/${e.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 hover:bg-surface">
                      <span className="text-xs text-muted">#{e.number}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{e.customer.name} <span className="font-normal text-muted">· {e.title}</span></span>
                      <span className="text-xs text-muted">{date(e.createdAt)}</span>
                      <Badge tone={e.status === "Approved" ? "ok" : e.status === "Draft" ? "neutral" : e.status === "Viewed" ? "info" : "gold"}>{e.status}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
