"use client";

import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@/lib/types";

type Mode = "auto" | "light" | "dark";

function apply(mode: Mode) {
  const h = new Date().getHours();
  const theme = mode === "auto" ? (h >= 7 && h < 19 ? "light" : "dark") : mode;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themeMode = mode;
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("auto");
  useEffect(() => {
    try {
      setMode((localStorage.getItem("theme") as Mode) || "auto");
    } catch {}
  }, []);
  const next: Record<Mode, Mode> = { auto: "light", light: "dark", dark: "auto" };
  const Icon = mode === "auto" ? Monitor : mode === "light" ? Sun : Moon;
  const label = mode === "auto" ? "Auto (day/night)" : mode === "light" ? "Light" : "Dark";
  return (
    <button
      type="button"
      title={`Theme: ${label}`}
      onClick={() => {
        const m = next[mode];
        setMode(m);
        try {
          localStorage.setItem("theme", m);
        } catch {}
        apply(m);
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted hover:text-text"
    >
      <Icon className="size-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function LogoutButton() {
  return (
    <form action={logout}>
      <button className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted hover:text-text" title="Log out">
        <LogOut className="size-3.5" /> <span className="hidden sm:inline">Log out</span>
      </button>
    </form>
  );
}
