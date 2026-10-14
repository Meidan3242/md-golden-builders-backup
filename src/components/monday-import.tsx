"use client";

import { useState, useTransition } from "react";
import { importFromMonday } from "@/app/actions/leads";

export function MondayImportButton({ boardId, label }: { boardId: string; label: string }) {
  const [msg, setMsg] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <div>
      <button
        disabled={pending}
        onClick={() => start(async () => setMsg(await importFromMonday(boardId)))}
        className="w-full rounded-xl border border-gold bg-gold-soft py-2.5 text-sm font-semibold text-gold-text disabled:opacity-60"
      >
        {pending ? "Importing… (up to a minute)" : label}
      </button>
      {msg && <p className={`mt-2 text-sm ${msg.startsWith("Done") ? "text-ok" : "text-bad"}`}>{msg}</p>}
    </div>
  );
}
