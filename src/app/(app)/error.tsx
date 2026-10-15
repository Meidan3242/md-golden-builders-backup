"use client";

import { useEffect } from "react";

/** A page failed (often: the database didn't answer in time). Show it plainly with a retry. */
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    // The screen was opened before an update and called code that no longer exists — a fresh load fixes it.
    if (/server action|failed to fetch|unexpected response|loading chunk/i.test(error.message)) {
      try {
        if (!sessionStorage.getItem("mdg_auto_reload")) {
          sessionStorage.setItem("mdg_auto_reload", "1");
          location.reload();
        }
      } catch {}
    }
  }, [error]);
  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <p className="text-lg font-bold">This page didn&apos;t load</p>
      <p className="mt-1 text-sm text-muted">Usually the app was just updated, or the database was slow for a moment. Press Reload.</p>
      <p className="mt-1 break-words text-[11px] text-muted/70">{error.digest ? `Code ${error.digest}` : error.message.slice(0, 160)}</p>
      <div className="mt-4 flex justify-center gap-2">
        <button onClick={() => reset()} className="gold-gradient rounded-lg px-4 py-2 text-sm font-semibold text-black">Try again</button>
        <button onClick={() => { try { sessionStorage.removeItem("mdg_auto_reload"); } catch {} location.reload(); }} className="rounded-lg border border-border px-4 py-2 text-sm">Reload</button>
      </div>
    </div>
  );
}
