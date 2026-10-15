"use client";

import { useState, useTransition } from "react";
import { testStorage } from "@/app/actions/storage";

export function StorageTestButton() {
  const [msg, setMsg] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <div>
      <button
        disabled={pending}
        onClick={() => start(async () => setMsg(await testStorage()))}
        className="w-full rounded-xl border border-gold bg-gold-soft py-2.5 text-sm font-semibold text-gold-text disabled:opacity-60 sm:w-auto sm:px-5"
      >
        {pending ? "Checking…" : "Test Cloudflare storage"}
      </button>
      {msg && <p className={`mt-2 text-sm ${msg.startsWith("Done") ? "text-ok" : "text-bad"}`}>{msg}</p>}
    </div>
  );
}
