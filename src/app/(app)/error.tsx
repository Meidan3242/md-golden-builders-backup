"use client";

import { useEffect } from "react";

/** A page failed (often: the database didn't answer in time). Show it plainly with a retry. */
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <p className="text-lg font-bold">This page didn&apos;t load</p>
      <p className="mt-1 text-sm text-muted">Usually the database was slow for a moment. Try again.{error.digest ? ` (code ${error.digest})` : ""}</p>
      <div className="mt-4 flex justify-center gap-2">
        <button onClick={() => reset()} className="gold-gradient rounded-lg px-4 py-2 text-sm font-semibold text-black">Try again</button>
        <button onClick={() => location.reload()} className="rounded-lg border border-border px-4 py-2 text-sm">Reload</button>
      </div>
    </div>
  );
}
