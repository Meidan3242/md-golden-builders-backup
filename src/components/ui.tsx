import clsx from "clsx";
import Link from "next/link";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("rounded-xl border border-border bg-card", className)}>{children}</div>;
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
    <button type="button" className={cls}>
      {children}
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
