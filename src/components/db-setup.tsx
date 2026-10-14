"use client";

import { useState, useTransition } from "react";
import { setupDatabase } from "@/app/actions/leads";

export function DbSetupButton({ label }: { label: string }) {
  const [msg, setMsg] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <div>
      <button
        disabled={pending}
        onClick={() => start(async () => setMsg(await setupDatabase()))}
        className="gold-gradient w-full rounded-xl py-2.5 text-sm font-bold text-black disabled:opacity-60"
      >
        {pending ? "Working…" : label}
      </button>
      {msg && <p className={`mt-2 text-sm ${msg.startsWith("Failed") ? "text-bad" : "text-ok"}`}>{msg}</p>}
    </div>
  );
}
