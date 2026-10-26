import { Eye, FileUp, Mail, MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import { BackLink, Button, Card, CardHeader, Soon } from "@/components/ui";
import { DEMO_CONTRACT as K } from "@/lib/demo-docs";
import { dbConfigured } from "@/lib/clock";
import { money } from "@/lib/format";

const input = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-gold";

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? "sm:col-span-2" : undefined}>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

/** New project: usually filled from the signed contract. The welcome email goes out the moment it's created. */
export default function NewProject() {
  // With real data the sample below (a fictional customer) is never shown.
  if (dbConfigured())
    return (
      <>
        <BackLink href="/projects" label="Projects" />
        <h1 className="mb-4 text-2xl font-bold tracking-tight">New project</h1>
        <Card>
          <CardHeader title="Not in the app yet" />
          <p className="p-4 text-sm text-muted">Projects come in from monday for now (Settings → Import). Creating a project straight from a signed contract is the next step.</p>
        </Card>
      </>
    );
  return (
    <>
      <BackLink href="/projects" label="Projects" />
      <h1 className="text-2xl font-bold tracking-tight">New project</h1>
      <p className="mb-4 text-sm text-muted">Signed in the app? Everything is already filled from the contract — just check and tap Create.</p>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Signed contract" />
            <div className="flex items-center gap-3 p-4">
              <FileUp className="size-8 text-gold-text" />
              <div className="min-w-0 flex-1 text-sm">
                <div className="font-medium">Contract #1 — {K.title}</div>
                <div className="text-xs text-muted">Signed by both sides · Form 203 + Additional Description (scope of work)</div>
              </div>
              <span className="rounded-full bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok">✓ Signed</span>
            </div>
          </Card>

          <Card>
            <CardHeader title="Customer" />
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="Name"><input className={input} defaultValue={K.customer.name} /></Field>
              <Field label="Phone"><input className={input} defaultValue="(858) 555-0144" /></Field>
              <Field label="Email"><input className={input} defaultValue={K.customer.email} /></Field>
              <Field label="Project type"><input className={input} defaultValue="Garden wall" /></Field>
              <Field label="Property address" wide><input className={input} defaultValue={K.customer.address} /></Field>
            </div>
          </Card>

          <Card className="overflow-x-auto">
            <CardHeader title="Payment schedule" subtitle="From the contract — goes into the welcome email" action={<span className="text-sm font-bold">{money(K.price)}</span>} />
            <ul className="divide-y divide-border">
              {K.schedule.map((m, i) => (
                <li key={m.name} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="text-muted">{i + 1}</span>
                  <span className="flex-1">{m.name}</span>
                  <span className="font-semibold">{money(m.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border px-4 py-2"><Soon className="inline-flex items-center gap-1 text-xs font-medium text-gold-text"><Plus className="size-3.5" /> Add a payment</Soon></div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-gold/50 p-4">
            <div className="font-semibold">When you tap Create</div>
            <ol className="mt-2 space-y-2 text-sm">
              <li className="flex gap-2"><span className="gold-gradient flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-black">1</span> The project opens under Ongoing projects</li>
              <li className="flex gap-2"><span className="gold-gradient flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-black">2</span><span><Mail className="inline size-3.5" /> The customer gets the <b>welcome email</b>: signed contract, scope of work, our license, the payment schedule, and “we do it all in-house, A to Z”</span></li>
              <li className="flex gap-2"><span className="gold-gradient flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-black">3</span><span><MessageSquare className="inline size-3.5" /> A short text from (858) 332-2168: “Welcome! Check your email for everything.”</span></li>
            </ol>
            <Link href="/p/welcome/demo" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gold-text hover:underline"><Eye className="size-4" /> See the welcome email</Link>
          </Card>
          <Button variant="primary" className="w-full justify-center py-3 text-base">Create project & send welcome email</Button>
        </div>
      </div>
    </>
  );
}
