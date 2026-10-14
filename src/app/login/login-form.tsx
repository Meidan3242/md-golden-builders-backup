"use client";

import clsx from "clsx";
import { Lock } from "lucide-react";
import { useActionState, useState } from "react";
import { login } from "@/app/actions/auth";

type Person = { id: string; name: string; title: string; ready: boolean };

export function LoginForm({ people, next }: { people: Person[]; next: string }) {
  const [error, action, pending] = useActionState(login, null);
  const [user, setUser] = useState(people[0]?.id ?? "");
  return (
    <form action={action} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h1 className="text-xl font-bold">Log in</h1>
      <p className="mb-4 text-sm text-muted">Who are you?</p>
      <input type="hidden" name="user" value={user} />
      <input type="hidden" name="next" value={next} />
      <div className="mb-4 grid grid-cols-2 gap-2">
        {people.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={!p.ready}
            onClick={() => setUser(p.id)}
            className={clsx("rounded-xl border px-3 py-2.5 text-left text-sm disabled:opacity-40", user === p.id ? "border-gold bg-gold-soft" : "border-border")}
          >
            <div className="font-semibold">{p.name.replace("Demo ", "")}</div>
            <div className="text-[11px] text-muted">{p.title}</div>
          </button>
        ))}
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Password</span>
        <input name="password" type="password" autoComplete="current-password" required autoFocus className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-gold" />
      </label>
      {error && <p className="mt-2 text-sm font-medium text-bad">{error}</p>}
      <button disabled={pending} className="gold-gradient mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-base font-bold text-black disabled:opacity-60">
        <Lock className="size-4" /> {pending ? "Checking…" : "Log in"}
      </button>
      <p className="mt-3 text-center text-[11px] text-muted">You stay logged in on this phone for 30 days.</p>
    </form>
  );
}
