"use client";

import { Dancing_Script } from "next/font/google";
import { useState } from "react";
import { signContract } from "@/app/actions/contracts";
import { initialsOf } from "@/lib/contract-form";
import { UPDATED_MSG } from "./updated-notice";

const script = Dancing_Script({ subsets: ["latin"], weight: "600" });
const small = "block text-[11px] font-semibold uppercase tracking-wider text-[#777]";

/** The only thing the customer does: sign. Their name is already filled in; one tap signs every marked place. */
export function SignContract({ token, ownerName, age65, version }: { token: string; ownerName: string; age65: boolean; version: string }) {
  const [name, setName] = useState(ownerName);
  const [msg, setMsg] = useState<string>();
  const [pending, setPending] = useState(false);
  return (
    <form
      id="sign"
      className="mx-auto max-w-[820px] scroll-mt-4 border-2 border-[#1c1c1c] bg-white p-5 text-[#1c1c1c] sm:p-8 print:hidden"
      onSubmit={(e) => {
        e.preventDefault();
        setPending(true);
        setMsg(undefined);
        signContract(token, { name, version })
          .then((r) => (r === "Done" ? window.location.assign(window.location.pathname) : setMsg(r === "UPDATED" ? UPDATED_MSG.contract : r)), () => setMsg("Something went wrong — please try again.")) // signed: reopen as the signed copy
          .finally(() => setPending(false));
      }}
    >
      <h2 className="font-letter text-xl font-bold">Sign your contract</h2>
      <p className="mt-1 text-sm text-[#555]">Everything is already filled in. Your signature goes on every gold spot (pages 1, 3, 5 and 6) with one tap.</p>

      <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-2 text-[#1b2f6e]">
        <div><div className={small}>Your signature</div><div className={`${script.className} text-4xl`}>{name.trim() || "—"}</div></div>
        <div><div className={small}>Initials</div><div className={`${script.className} text-4xl`}>{initialsOf(name) || "—"}</div></div>
      </div>
      <label className={`${small} mt-4`}>Full legal name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mt-1 w-full border-0 border-b border-[#c9c2b3] bg-transparent px-1 py-1.5 text-base outline-none focus:border-[#b8902f]" />

      <p className="mt-5 text-xs leading-relaxed text-[#555]">
        By tapping <b>Sign the contract</b> I agree to sign electronically, my typed name is my signature and initials on every marked place, and I received a completely filled-in copy, including the Notice of Cancellation. I may cancel within {age65 ? "five" : "three"} business days after signing.
      </p>
      <button disabled={pending} className="mt-4 w-full bg-[#1c1c1c] py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white disabled:opacity-60 sm:w-auto sm:px-14">
        {pending ? "Signing…" : "Sign the contract"}
      </button>
      {msg && (
        <p className="mt-2 text-sm text-[#b91c1c]">
          {msg}
          {msg === UPDATED_MSG.contract && <button type="button" onClick={() => window.location.reload()} className="ml-2 font-semibold underline">Show the new version</button>}
        </p>
      )}
    </form>
  );
}
