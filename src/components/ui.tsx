import clsx from "clsx";
import Link from "next/link";

export function Card({ className, children, id }: { className?: string; children: React.ReactNode; id?: string }) {
  return <div id={id} className={clsx("rounded-xl border border-border bg-card", className)}>{children}</div>;
}

export function CardHeader({ title, action, subtitle }: { title: React.ReactNode; action?: React.ReactNode; subtitle?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

type Tone = "neutral" | "gold" | "ok" | "warn" | "bad" | "info";
const tones: Record<Tone, string> = {
  neutral: "bg-surface text-muted border-border",
  gold: "bg-gold-soft text-gold-text border-transparent",
  ok: "bg-ok-soft text-ok border-transparent",
  warn: "bg-warn-soft text-warn border-transparent",
  bad: "bg-bad-soft text-bad border-transparent",
  info: "bg-info-soft text-info border-transparent",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: "gold" | "ok" | "bad" }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className={clsx("mt-1 text-2xl font-bold tracking-tight", tone === "gold" && "text-gold-text", tone === "ok" && "text-ok", tone === "bad" && "text-bad")}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </Card>
  );
}

export function Button({ children, variant = "secondary", href, className }: { children: React.ReactNode; variant?: "primary" | "secondary" | "ghost"; href?: string; className?: string }) {
  const cls = clsx(
    "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    variant === "primary" && "gold-gradient text-black shadow-sm hover:brightness-105",
    variant === "secondary" && "border border-border bg-card hover:bg-surface",
    variant === "ghost" && "hover:bg-surface",
    className,
  );
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    // Not wired yet → visibly disabled with a "Soon" tag, so nobody taps it and thinks it worked.
    <Soon className={cls}>{children}</Soon>
  );
}

/** A button for something that isn't built yet: greyed out, can't be tapped, says "Soon". */
export function Soon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button type="button" disabled title="Coming soon — not working yet" className={clsx(className, "cursor-not-allowed opacity-50")}>
      {children}
      <span className="ml-1 rounded bg-surface px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-muted">Soon</span>
    </button>
  );
}

export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span className={clsx("inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-soft text-[10px] font-bold text-gold-text", className)}>
      {initials}
    </span>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={clsx("h-1.5 w-full overflow-hidden rounded-full bg-surface", className)}>
      <div className="gold-gradient h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} />
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-8 text-center text-sm text-muted">{children}</div>;
}

export function Tabs({ tabs, active, base }: { tabs: { key: string; label: string; count?: number }[]; active: string; base: string }) {
  return (
    <div className="scrollbar-thin -mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-border px-4 md:mx-0 md:px-0">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={`${base}?tab=${t.key}`}
          className={clsx(
            "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium",
            t.key === active ? "border-gold text-text" : "border-transparent text-muted hover:text-text",
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 rounded-full bg-surface px-1.5 text-[11px] text-muted">{t.count}</span>}
        </Link>
      ))}
    </div>
  );
}

export function KeyValue({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="min-w-0 truncate text-right font-medium sm:text-left">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A big tappable box that leads to a page. The whole app is navigated with these. */
export function Tile({
  href,
  icon,
  title,
  count,
  hint,
  tone,
  children,
}: {
  href: string;
  icon?: React.ReactNode;
  title: string;
  count?: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "gold" | "bad" | "ok";
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "group flex flex-col rounded-2xl border bg-card p-4 transition hover:border-gold hover:shadow-md",
        tone === "bad" ? "border-bad/40" : tone === "gold" ? "border-gold/50" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {icon && <span className="flex size-10 items-center justify-center rounded-xl bg-gold-soft text-gold-text [&>svg]:size-5">{icon}</span>}
        {count !== undefined && (
          <span className={clsx("text-3xl font-bold leading-none", tone === "bad" && "text-bad", tone === "ok" && "text-ok")}>{count}</span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-1 font-semibold">
        {title} <span className="text-muted transition group-hover:translate-x-0.5 group-hover:text-gold-text">→</span>
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
      {children}
    </Link>
  );
}

/** A section that opens on tap and can always be closed again. */
export function Collapse({ title, right, open, children }: { title: React.ReactNode; right?: React.ReactNode; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group rounded-xl border border-border bg-card [&[open]>summary_.chev]:rotate-90">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="chev text-muted transition">▸</span>
        <div className="min-w-0 flex-1">{title}</div>
        {right}
      </summary>
      <div className="space-y-3 border-t border-border p-3">{children}</div>
    </details>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-gold-text hover:underline">
      ← {label}
    </Link>
  );
}
