"use client";

import clsx from "clsx";
import { ArrowRight, MapPin, X } from "lucide-react";
import Link from "next/link";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";

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
  const el = useRef<HTMLDivElement>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);

  // Real street map (OpenStreetMap data, CARTO tiles). Zoom in to a street, tap a pin.
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      if (cancelled || !el.current || map.current) return;
      L.current = mod;
      const m = mod.map(el.current, { zoomControl: true }).setView([32.86, -117.12], 10);
      // Standard OpenStreetMap streets (free, no key). CARTO's tiles now need a paid key.
      mod.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(m);
      layer.current = mod.layerGroup().addTo(m);
      map.current = m;
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !L.current || !layer.current) return;
    layer.current.clearLayers();
    for (const p of visible) {
      const active = sel?.id === p.id;
      L.current
        .circleMarker([p.lat, p.lng], { radius: active ? 12 : 8, color: "#fff", weight: active ? 4 : 2, fillColor: KIND[p.kind].color, fillOpacity: 0.95 })
        .on("click", () => setSel(p))
        .addTo(layer.current);
    }
  }, [ready, visible, sel]);

  useEffect(() => {
    if (sel && map.current) map.current.panTo([sel.lat, sel.lng]);
  }, [sel]);

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
          <div ref={el} className="z-0 h-[420px] w-full bg-surface sm:h-[560px]" role="region" aria-label="Map of projects in San Diego County" />
        </div>
        <p className="mt-1.5 text-[11px] text-muted">Pinch or scroll to zoom down to the street. Tap a pin to open the job.</p>
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
