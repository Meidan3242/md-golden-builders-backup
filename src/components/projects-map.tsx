"use client";

import clsx from "clsx";
import { ArrowRight, MapPin, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export type MapPoint = {
  id: string;
  kind: "active" | "completed" | "estimate" | "lead";
  title: string;
  subtitle: string;
  address: string;
  lat: number;
  lng: number;
  value?: string;
  href?: string;
  photos?: number[]; // demo thumbnails (hues)
};

// San Diego County window: Chula Vista / border → Fallbrook, coast → Julian.
const B = { n: 33.47, s: 32.52, w: -117.62, e: -116.5 };
const W = 1000;
const H = Math.round(W * ((B.n - B.s) / (B.e - B.w)) * 1.19); // ~cos(33°) aspect
const x = (lng: number) => ((lng - B.w) / (B.e - B.w)) * W;
const y = (lat: number) => ((B.n - lat) / (B.n - B.s)) * H;

const COAST: [number, number][] = [
  [33.47, -117.62], [33.38, -117.58], [33.3, -117.47], [33.2, -117.39], [33.16, -117.35], [33.1, -117.32], [33.04, -117.3],
  [32.96, -117.27], [32.88, -117.255], [32.85, -117.275], [32.8, -117.26], [32.76, -117.255], [32.72, -117.25], [32.67, -117.245],
  [32.69, -117.2], [32.68, -117.17], [32.63, -117.14], [32.58, -117.13], [32.53, -117.125],
];
const LAND = `M${COAST.map(([la, ln]) => `${x(ln)},${y(la)}`).join(" L")} L${W},${H} L${W},0 Z`;

const CITIES: [string, number, number][] = [
  ["Fallbrook", 33.376, -117.251], ["Oceanside", 33.196, -117.38], ["Carlsbad", 33.158, -117.351], ["Escondido", 33.119, -117.086],
  ["Ramona", 33.042, -116.868], ["Julian", 33.079, -116.602], ["Encinitas", 33.037, -117.292], ["Poway", 32.963, -117.036],
  ["La Jolla", 32.833, -117.271], ["Santee", 32.838, -116.974], ["El Cajon", 32.795, -116.962], ["San Diego", 32.716, -117.161],
  ["La Mesa", 32.768, -117.023], ["Chula Vista", 32.64, -117.084],
];

const KIND = {
  active: { label: "Active projects", color: "#d09028" },
  completed: { label: "Completed", color: "#15803d" },
  estimate: { label: "Open estimates", color: "#ea580c" },
  lead: { label: "New leads", color: "#2563eb" },
} as const;

export function ProjectsMap({ points }: { points: MapPoint[] }) {
  const [show, setShow] = useState<Record<string, boolean>>({ active: true, completed: true, estimate: true, lead: false });
  const [sel, setSel] = useState<MapPoint | null>(points.find((p) => p.kind === "active") ?? null);
  const visible = points.filter((p) => show[p.kind]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {(Object.keys(KIND) as (keyof typeof KIND)[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setShow((s) => ({ ...s, [k]: !s[k] }))}
              className={clsx("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs", show[k] ? "border-border bg-card font-medium" : "border-transparent text-muted line-through")}
            >
              <span className="size-2.5 rounded-full" style={{ background: KIND[k].color }} />
              {KIND[k].label} <span className="text-muted">{points.filter((p) => p.kind === k).length}</span>
            </button>
          ))}
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Map of projects in San Diego County">
            <rect width={W} height={H} fill="#cfe3ef" />
            <path d={LAND} fill="#f4f1ea" stroke="#b9c9d3" strokeWidth={1.5} />
            {CITIES.map(([name, la, ln]) => (
              <text key={name} x={x(ln)} y={y(la) - 16} textAnchor="middle" fontSize={15} fill="#8a8478" fontWeight={600}>{name}</text>
            ))}
            {visible.map((p) => {
              const active = sel?.id === p.id;
              return (
                <g key={p.id} transform={`translate(${x(p.lng)},${y(p.lat)})`} onClick={() => setSel(p)} className="cursor-pointer">
                  <circle r={active ? 13 : 9} fill={KIND[p.kind].color} stroke="#fff" strokeWidth={active ? 4 : 2.5} opacity={0.95} />
                  {active && <circle r={22} fill="none" stroke={KIND[p.kind].color} strokeWidth={2} opacity={0.5} />}
                </g>
              );
            })}
          </svg>
        </div>
        <p className="mt-1.5 text-[11px] text-muted">Prototype map. The live version uses a real street map — zoom to a street, tap a pin.</p>
      </div>

      <div className="space-y-3">
        {sel ? (
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-start justify-between gap-2 border-b border-border p-4">
              <div>
                <span className="mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{ background: KIND[sel.kind].color }}>{KIND[sel.kind].label.replace(/s$/, "")}</span>
                <div className="font-semibold">{sel.title}</div>
                <div className="text-xs text-muted">{sel.subtitle}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted"><MapPin className="size-3" /> {sel.address}</div>
              </div>
              <button type="button" onClick={() => setSel(null)} className="text-muted" aria-label="Close"><X className="size-4" /></button>
            </div>
            {sel.photos && (
              <div className="grid grid-cols-3 gap-1 p-2">
                {sel.photos.map((h, i) => (
                  <div key={i} className="aspect-square rounded" style={{ background: `linear-gradient(135deg, hsl(${h} 25% 62%), hsl(${(h + 40) % 360} 30% 38%))` }} />
                ))}
              </div>
            )}
            <div className="flex items-center justify-between p-4 pt-2">
              <span className="text-lg font-bold">{sel.value}</span>
              {sel.href && <Link href={sel.href} className="gold-gradient inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-black">Open <ArrowRight className="size-4" /></Link>}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">Tap a pin to open the project</div>
        )}
        <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted">
          <div className="mb-1 text-sm font-semibold text-text">Use it for</div>
          • Planning your day — open estimates near today&apos;s appointments<br />
          • Sales — “we built 3 projects on your street” + photos<br />
          • Seeing where the money comes from, by area
        </div>
      </div>
    </div>
  );
}
