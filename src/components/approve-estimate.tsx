"use client";

import { useState } from "react";
import { approveEstimate } from "@/app/actions/estimates";
import { UPDATED_MSG } from "./updated-notice";

/** The customer types their name and approves. Nothing is charged; Meidan follows up with the contract. */
export function ApproveEstimate({ token, first, version }: { token: string; first: string; version: string }) {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string>();
  const [pending, setPending] = useState(false);
  const start = (run: () => Promise<void>) => {
    setPending(true);
    run().finally(() => setPending(false));
  };
  return (
    <form
      className="mt-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await approveEstimate(token, name, version);
          if (r === "UPDATED") return setMsg(UPDATED_MSG.estimate);
          if (r !== "Done") setMsg(r); // on success the action refreshes this page
        });
      }}
    >
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777]">Full name of the property owner</label>
      <input value={name} onChange={(e) => setName(e.target.value)} required minLength={3} autoComplete="name" placeholder={`e.g. ${first} …`} className="font-letter mt-1 w-full border-0 border-b border-[#1c1c1c] bg-transparent px-1 py-2 text-xl outline-none focus:border-[#b8902f]" />
      <button disabled={pending} className="mt-4 w-full bg-[#1c1c1c] py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white disabled:opacity-60 sm:w-auto sm:px-10">
        {pending ? "Saving…" : "Approve estimate"}
      </button>
      {msg && (
        <p className="mt-2 text-sm text-[#b91c1c]">
          {msg}
          {msg === UPDATED_MSG.estimate && <button type="button" onClick={() => window.location.reload()} className="ml-2 font-semibold underline">Show the new version</button>}
        </p>
      )}
    </form>
  );
}
