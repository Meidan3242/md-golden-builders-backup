"use client";

import { Copy, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteDraftEstimate, duplicateEstimate } from "@/app/actions/estimates";

const btn = "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-surface disabled:opacity-60";

/** Copy this estimate into a new draft. */
export function DuplicateEstimate({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(async () => window.location.assign(await duplicateEstimate(id)))} className={btn}>
      <Copy className="size-4" /> {pending ? "Copying…" : "Duplicate"}
    </button>
  );
}

/** Delete a draft that never went out (asks first). */
export function DeleteDraftEstimate({ id, number }: { id: string; number: number }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => confirm(`Delete draft estimate #${number}? This can't be undone.`) && start(async () => window.location.assign(await deleteDraftEstimate(id)))} className={`${btn} text-bad`}>
      <Trash2 className="size-4" /> {pending ? "Deleting…" : "Delete draft"}
    </button>
  );
}
