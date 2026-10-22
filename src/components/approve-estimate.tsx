"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { approveEstimate } from "@/app/actions/estimates";

/** The customer types their name and approves. Nothing is charged; Meidan follows up with the contract. */
export function ApproveEstimate({ token, first }: { token: string; first: string }) {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string>();
  const [pending, setPending] = useState(false);
  const start = (run: () => Promise<void>) => {
    setPending(true);
    run().finally(() => setPending(false));
  };
  return (
    <form
      className="mt-4 rounded-xl border border-gold/60 bg-gold-soft/40 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await approveEstimate(token, name);
          if (r !== "Done") setMsg(r); // on success the action refreshes this page
        });
      }}
    >
      <div className="text-sm font-semibold">Ready to go ahead, {first}?</div>
      <p className="mb-2 text-xs text-muted">Type your full name and tap Approve. Nothing is charged now — I&apos;ll send you the contract to sign next.</p>
      <input value={name} onChange={(e) => setName(e.target.value)} required minLength={3} autoComplete="name" placeholder="Your full name" className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base" />
      <button disabled={pending} className="gold-gradient mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black disabled:opacity-60">
        <CheckCircle2 className="size-4" /> {pending ? "Saving…" : "Approve estimate"}
      </button>
      {msg && <p className="mt-2 text-sm text-bad">{msg}</p>}
    </form>
  );
}
