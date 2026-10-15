"use server";

import { loggedInUser } from "@/lib/data";
import { testR2 } from "@/lib/storage";

export async function testStorage(): Promise<string> {
  const me = await loggedInUser();
  if (me?.role !== "admin") return "Only the owner can do this.";
  return testR2();
}

/** Settings → Diagnose: times each projects query (10s limit each) and lists anything stuck in the database. */
export async function diagnose(): Promise<string> {
  const me = await loggedInUser();
  if (me?.role !== "admin") return "Only the owner can do this.";
  const { sql } = await import("@/lib/db");
  const db = sql();
  const timed = async (label: string, run: () => Promise<unknown>) => {
    const t = Date.now();
    try {
      const r = await Promise.race([run(), new Promise((_, no) => setTimeout(() => no(new Error("no answer in 10s")), 10_000))]);
      return `${label}: ${Array.isArray(r) ? `${r.length} rows` : "ok"} in ${Date.now() - t}ms`;
    } catch (e) {
      return `${label}: FAILED — ${(e as Error).message}`;
    }
  };
  const lines = [
    await timed("projects", () => db`select id from projects`),
    await timed("contracts", () => db`select id from project_contracts`),
    await timed("payments", () => db`select id from project_payments`),
    await timed("expenses", () => db`select id from project_expenses`),
    await timed("files", () => db`select id from project_files`),
    await timed("all projects (app)", async () => (await import("@/lib/project-repo")).dbProjects()),
  ];
  const stuck = await db`select state, wait_event_type, left(query, 70) as q, extract(epoch from now() - query_start)::int as secs
                         from pg_stat_activity where datname = current_database() and pid <> pg_backend_pid() and state <> 'idle'
                         order by query_start limit 5`.then((r) => r as unknown as Record<string, unknown>[]).catch((e): Record<string, unknown>[] => [{ state: "check failed", q: (e as Error).message }]);
  lines.push(stuck.length ? `Busy in the database:\n${stuck.map((r) => `  · [${r.state} ${r.wait_event_type ?? ""} ${r.secs ?? "?"}s] ${r.q}`).join("\n")}` : "Nothing stuck in the database");
  return `Done ✓\n${lines.join("\n")}`;
}
