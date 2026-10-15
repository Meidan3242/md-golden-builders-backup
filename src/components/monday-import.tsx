"use client";

import { useState, useTransition } from "react";
import { importClientsFromMonday, importFilesFromMonday, importFromMonday, type ImportStep } from "@/app/actions/leads";

/** Runs an import; big ones come back in rounds and the button keeps going by itself until done. */
export function MondayImportButton({ boardId, label, clients, files }: { boardId?: string; label: string; clients?: boolean; files?: boolean }) {
  const [msg, setMsg] = useState<string>();
  const [pending, start] = useTransition();
  const run = () =>
    start(async () => {
      try {
        if (!clients && !files) return setMsg(await importFromMonday(boardId!));
        let step: ImportStep = { msg: "Starting…", next: 0 };
        for (let round = 0; round < 200 && step.next != null; round++) {
          step = clients ? await importClientsFromMonday(step.next) : await importFilesFromMonday();
          setMsg(step.msg);
        }
      } catch {
        setMsg("Failed: it took too long or the connection dropped — press again.");
      }
    });
  return (
    <div>
      <button
        disabled={pending}
        onClick={run}
        className="w-full rounded-xl border border-gold bg-gold-soft py-2.5 text-sm font-semibold text-gold-text disabled:opacity-60"
      >
        {pending ? "Working… keep this screen open" : label}
      </button>
      {msg && <p className={`mt-2 text-sm ${msg.startsWith("Done") ? "text-ok" : msg.startsWith("Failed") ? "text-bad" : "text-muted"}`}>{msg}</p>}
    </div>
  );
}
