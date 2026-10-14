import "server-only";
import postgres from "postgres";
import { cache } from "react";
import { MIGRATIONS } from "./migrations";
import { databaseUrl, dbConfigured } from "./clock";

// One connection pool per server instance. Supabase's pooled URL (port 6543) needs prepare: false.
const g = globalThis as unknown as { __sql?: postgres.Sql };
export function sql() {
  if (!dbConfigured()) throw new Error("Database not connected");
  const url = databaseUrl()!;
  g.__sql ??= postgres(url, { prepare: false, max: 3, idle_timeout: 20, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require" });
  return g.__sql;
}

/** Latest schema version applied (0 = tables not created yet, null = no database / can't connect). */
export const schemaVersion = cache(async (): Promise<number | null> => {
  if (!dbConfigured()) return null;
  try {
    const db = sql();
    const [t] = await db`select to_regclass('public.schema_migrations') as t`;
    if (!t.t) return 0;
    const [r] = await db`select coalesce(max(version), 0)::int as v from schema_migrations`;
    return r.v as number;
  } catch (e) {
    console.error("db check failed", e);
    return null;
  }
});

/** Real data on? (database connected and the leads tables exist) */
export async function dbReady() {
  return ((await schemaVersion()) ?? 0) >= 1;
}

export async function migrate() {
  const db = sql();
  await db`create table if not exists schema_migrations (version int primary key, applied_at timestamptz not null default now())`;
  await db`alter table schema_migrations enable row level security`;
  const [r] = await db`select coalesce(max(version), 0)::int as v from schema_migrations`;
  const current = r.v as number;
  const applied: string[] = [];
  for (const m of MIGRATIONS.filter((x) => x.version > current)) {
    await db.begin(async (tx) => {
      await tx.unsafe(m.sql);
      await tx`insert into schema_migrations (version) values (${m.version})`;
    });
    applied.push(m.name);
  }
  return applied;
}
