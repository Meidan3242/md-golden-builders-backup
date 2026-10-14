"use client";

import { Monitor, Moon, Sun } from "lucide-react";
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

/** Demo only: switch who is "logged in" to see what each role can see. */
export function UserSwitcher({ users, current }: { users: User[]; current: string }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <span className="hidden lg:inline">Viewing as</span>
      <select
        value={current}
        onChange={(e) => {
          document.cookie = `demo_user=${e.target.value}; path=/; max-age=31536000`;
          router.refresh();
        }}
        className="w-36 truncate rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-medium text-text sm:w-auto"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} — {u.title}
          </option>
        ))}
      </select>
    </label>
  );
}
