"use client";

import { useState, useTransition } from "react";
import { importClientsFromMonday, importFromMonday } from "@/app/actions/leads";

export function MondayImportButton({ boardId, label, clients }: { boardId?: string; label: string; clients?: boolean }) {
  const [msg, setMsg] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <div>
      <button
        disabled={pending}
        onClick={() => start(async () => setMsg(clients ? await importClientsFromMonday() : await importFromMonday(boardId!)))}
        className="w-full rounded-xl border border-gold bg-gold-soft py-2.5 text-sm font-semibold text-gold-text disabled:opacity-60"
      >
        {pending ? "Importing… (up to a minute)" : label}
      </button>
      {msg && <p className={`mt-2 text-sm ${msg.startsWith("Done") ? "text-ok" : "text-bad"}`}>{msg}</p>}
    </div>
  );
}
