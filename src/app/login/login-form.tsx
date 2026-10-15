"use client";

import { Lock } from "lucide-react";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";

const field = "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-gold";

export function LoginForm({ next }: { next: string }) {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h1 className="mb-4 text-xl font-bold">Log in</h1>
      <input type="hidden" name="next" value={next} />
      <label className="mb-3 block">
        <span className="mb-1 block text-xs font-medium text-muted">Email</span>
        <input name="email" type="email" autoComplete="username" required autoFocus className={field} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className={field} />
      </label>
      {error && <p className="mt-2 text-sm font-medium text-bad">{error}</p>}
      <button disabled={pending} className="gold-gradient mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-base font-bold text-black disabled:opacity-60">
        <Lock className="size-4" /> {pending ? "Checking…" : "Log in"}
      </button>
      <p className="mt-3 text-center text-[11px] text-muted">You stay logged in on this phone for 30 days.</p>
    </form>
  );
}
