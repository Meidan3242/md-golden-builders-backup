"use client";

import { createContext, useActionState, useContext } from "react";
import { createLead } from "@/app/actions/leads";

const Pending = createContext(false);

/** Wraps the New lead form: saves to the database, then opens the new lead. */
export function LeadForm({ children }: { children: React.ReactNode }) {
  const [msg, action, pending] = useActionState(createLead, null);
  return (
    <form action={action}>
      <Pending.Provider value={pending}>{children}</Pending.Provider>
      {msg && <p className={`mt-3 text-sm font-semibold ${msg.startsWith("Demo") ? "text-warn" : "text-bad"}`}>{msg.startsWith("Demo") ? "Demo mode — the lead was NOT saved." : msg}</p>}
    </form>
  );
}

export function SaveButton() {
  const pending = useContext(Pending);
  return (
    <button disabled={pending} className="gold-gradient inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-black shadow-sm disabled:opacity-60">
      {pending ? "Saving…" : "Save lead"}
    </button>
  );
}
