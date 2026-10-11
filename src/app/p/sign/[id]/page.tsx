import clsx from "clsx";
import { existsSync } from "node:fs";
import path from "node:path";
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Lock, PenLine } from "lucide-react";
import Link from "next/link";
import { COMPANY, DEMO_ESTIMATE as E, SIGN_FIELDS, SIGN_PAGES } from "@/lib/demo-docs";
import { money } from "@/lib/format";

export const metadata = { title: "Sign your contract — MD Golden Builders" };

const script = { fontFamily: '"Snell Roundhand", "Segoe Script", "Brush Script MT", cursive' };

export default async function SignPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const n = Math.min(Math.max(Number((await searchParams).page) || 1, 1), SIGN_PAGES.length);
  const page = SIGN_PAGES[n - 1];
  const fields = SIGN_FIELDS.filter((f) => f.page === n);
  const required = SIGN_FIELDS.filter((f) => f.who !== "Contractor" && !f.optional);
  const doneCount = required.filter((f) => f.done).length;
  const current = SIGN_FIELDS.find((f) => !f.done && f.who !== "Contractor" && !f.optional);
  const hasImg = page.img && existsSync(path.join(process.cwd(), "public", page.img));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.png" alt="MD Golden Builders" className="h-9 w-auto" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">Home Improvement Contract — {E.customer.name}</div>
            <div className="text-xs text-muted">7 pages · contract (5) + Additional Description (2)</div>
          </div>
          <div className="hidden text-right text-xs sm:block">
            <div className="font-semibold">{doneCount} of {required.length} done</div>
            <div className="mt-1 h-1.5 w-32 rounded-full bg-surface"><div className="gold-gradient h-1.5 rounded-full" style={{ width: `${(doneCount / required.length) * 100}%` }} /></div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <Link href={`?page=${Math.max(1, n - 1)}`} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1"><ChevronLeft className="size-4" /> Prev</Link>
            <span className="font-medium">Page {n} of {SIGN_PAGES.length} · {page.title}</span>
            <Link href={`?page=${Math.min(SIGN_PAGES.length, n + 1)}`} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1">Next <ChevronRight className="size-4" /></Link>
          </div>

          <div className="relative mx-auto w-full max-w-[680px] overflow-hidden rounded-lg border border-border bg-white shadow-sm" style={{ aspectRatio: "612 / 1008" }}>
            {hasImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={page.img!} alt={page.title} className="absolute inset-0 h-full w-full" />
            ) : n >= 6 ? (
              <AdditionalDescription part={n - 5} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-muted">{page.title}<br />(your Form 203 page is shown here)</div>
            )}
            {fields.map((f) => {
              const isCurrent = current?.id === f.id;
              return (
                <div
                  key={f.id}
                  className={clsx(
                    "absolute flex -translate-y-full items-center rounded px-1.5 text-[11px] font-semibold shadow-sm",
                    f.done ? "border border-ok/40 bg-ok-soft text-ok" : f.who === "Contractor" ? "bg-info-soft text-info" : isCurrent ? "gold-gradient animate-pulse text-black ring-2 ring-gold/40" : f.optional ? "border border-dashed border-gold bg-white/90 text-gold-text" : "bg-gold-soft text-gold-text",
                  )}
                  style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: "1.9%" }}
                  title={f.label}
                >
                  {f.done ? (
                    <span className="truncate text-sm font-normal" style={script}>{f.kind === "Initials" ? (f.who === "Contractor" ? "MD" : "RD") : f.who === "Contractor" ? "Meidan D." : "Rachel Donovan"}</span>
                  ) : (
                    <span className="flex items-center gap-1 truncate"><PenLine className="size-3 shrink-0" />{f.who === "Contractor" ? "Contractor" : f.kind === "Initials" ? "Initial" : "Sign here"}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="scrollbar-thin mt-3 flex justify-center gap-2 overflow-x-auto">
            {SIGN_PAGES.map((p) => {
              const pf = SIGN_FIELDS.filter((f) => f.page === p.n && f.who !== "Contractor" && !f.optional);
              const left = pf.filter((f) => !f.done).length;
              return (
                <Link key={p.n} href={`?page=${p.n}`} className={clsx("flex w-14 shrink-0 flex-col items-center rounded-lg border p-1.5 text-[10px]", p.n === n ? "border-gold bg-gold-soft" : "border-border bg-card")}>
                  <span className="font-bold">{p.n}</span>
                  {pf.length ? (left ? <span className="text-gold-text">{left} to sign</span> : <span className="text-ok">✓ done</span>) : <span className="text-muted">read</span>}
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-sm font-semibold">Your signature</div>
            <div className="mt-2 rounded-lg border border-dashed border-gold bg-gold-soft/50 px-3 py-3 text-2xl" style={script}>Rachel Donovan</div>
            <div className="mt-1 text-[11px] text-muted">Tap any gold box to place it. Draw or type — both are legally valid e-signatures.</div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-2.5 text-sm font-semibold">Everything to sign ({SIGN_FIELDS.length} spots)</div>
            <ul className="divide-y divide-border">
              {SIGN_FIELDS.map((f) => (
                <li key={f.id}>
                  <Link href={`?page=${f.page}`} className={clsx("flex items-start gap-2 px-4 py-2 text-xs hover:bg-surface", current?.id === f.id && "bg-gold-soft")}>
                    {f.done ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-ok" /> : <Circle className={clsx("mt-0.5 size-3.5 shrink-0", f.who === "Contractor" ? "text-info" : "text-gold-text")} />}
                    <span className="flex-1">
                      <span className="font-medium">{f.label}</span>
                      <span className="block text-muted">p.{f.page} · {f.who} · {f.kind}{f.optional ? ` · ${f.optional}` : ""}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted">
            <div className="mb-1 flex items-center gap-1 font-semibold text-text"><Lock className="size-3.5" /> Secure & recorded</div>
            Each signature is stamped with date, time, IP and device. You&apos;ll receive the fully signed PDF by email. You have 3 business days to cancel (5 if 65 or older).
          </div>

          <button className="gold-gradient w-full rounded-xl py-3 text-sm font-bold text-black opacity-60">Finish & sign ({required.length - doneCount} left)</button>
        </aside>
      </div>
    </div>
  );
}

/** Our own generated Additional Description pages (scope + price + payment schedule). */
function AdditionalDescription({ part }: { part: number }) {
  const deposit = 1000;
  const rest = E.base - deposit;
  return (
    <div className="absolute inset-0 flex flex-col p-[6%] text-[clamp(7px,1.5vw,11px)] leading-snug text-black">
      <div className="text-center font-bold tracking-wide">ADDITIONAL DESCRIPTION</div>
      <div className="mb-3 text-center text-[0.85em]">{COMPANY.name} · {COMPANY.license} · {COMPANY.phone}</div>
      <div className="mb-2 grid grid-cols-2 gap-2 border-y border-black/30 py-1.5 text-[0.9em]">
        <div><b>Owner:</b> {E.customer.name}<br />{E.customer.address}</div>
        <div className="text-right"><b>Contract date:</b> {E.date}<br /><b>Estimate #</b>{E.number}</div>
      </div>
      {part === 1 ? (
        <div className="space-y-2">
          <div className="font-bold">Scope of Work: {E.title}</div>
          {E.sections.map((s) => (
            <div key={s.title}>
              <div className="font-semibold uppercase">{s.title}</div>
              {s.items.map((i) => <div key={i}>• {i}</div>)}
            </div>
          ))}
          <div><b>EXCLUSIONS:</b> {E.exclusions.join("; ")}</div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-[1.15em] font-bold">CONTRACT PRICE: {money(E.base)}</div>
          <div className="font-semibold">PAYMENT SCHEDULE</div>
          {E.schedule.map((m) => (
            <div key={m.name} className="flex justify-between border-b border-dotted border-black/30">
              <span>{m.name}</span>
              <span>{money(m.pct === null ? deposit : Math.round(rest * m.pct))}</span>
            </div>
          ))}
          <div className="pt-2">Warranty: {E.warranty}.</div>
        </div>
      )}
      <div className="mt-auto grid grid-cols-2 gap-6 pt-6 text-[0.85em]">
        <div className="border-t border-black pt-0.5">Contractor (signature)</div>
        <div className="border-t border-black pt-0.5">Owner or Agent (signature)</div>
      </div>
    </div>
  );
}
