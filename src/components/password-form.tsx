"use client";

import { useActionState, useTransition, useState } from "react";
import { logOutEverywhere, setPassword } from "@/app/actions/auth";

const field = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-base outline-none focus:border-gold";

/** New password (+ current one when changing your own). */
export function PasswordForm({ user, askCurrent, label }: { user: string; askCurrent: boolean; label: string }) {
  const [msg, action, pending] = useActionState(setPassword, null);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="user" value={user} />
      {askCurrent && <input name="current" type="password" autoComplete="current-password" required placeholder="Current password" className={field} />}
      <input name="password" type="password" autoComplete="new-password" required minLength={10} placeholder="New password (10+ characters)" className={field} />
      <input name="confirm" type="password" autoComplete="new-password" required minLength={10} placeholder="New password again" className={field} />
      <button disabled={pending} className="gold-gradient w-full rounded-xl py-2.5 text-sm font-bold text-black disabled:opacity-60">{pending ? "Saving…" : label}</button>
      {msg && <p className={`text-sm ${msg.startsWith("Done") ? "text-ok" : "text-bad"}`}>{msg}</p>}
    </form>
  );
}

export function LogOutEverywhereButton({ user, name }: { user: string; name: string }) {
  const [msg, setMsg] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <div>
      <button disabled={pending} onClick={() => start(async () => setMsg(await logOutEverywhere(user)))} className="w-full rounded-xl border border-bad/50 py-2.5 text-sm font-semibold text-bad disabled:opacity-60">
        {pending ? "…" : `Log ${name} out everywhere`}
      </button>
      {msg && <p className={`mt-1 text-sm ${msg.startsWith("Done") ? "text-ok" : "text-bad"}`}>{msg}</p>}
    </div>
  );
}
