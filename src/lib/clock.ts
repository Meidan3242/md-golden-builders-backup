import { TODAY as DEMO_TODAY } from "./demo-data";

/**
 * Find an env var even if the Vercel ↔ Supabase link added a prefix
 * (e.g. STORAGE_POSTGRES_URL instead of POSTGRES_URL).
 */
export function envSuffix(...names: string[]): string | undefined {
  for (const n of names) if (process.env[n]) return process.env[n];
  for (const n of names) {
    const k = Object.keys(process.env).find((x) => x.endsWith(`_${n}`) && process.env[x]);
    if (k) return process.env[k];
  }
  return undefined;
}

export const databaseUrl = () => envSuffix("POSTGRES_URL", "DATABASE_URL");

/** True once the real database is connected (Vercel ↔ Supabase sets POSTGRES_URL). */
export const dbConfigured = () => !!databaseUrl();

/** "Now" for the app: the real clock with real data; a fixed day in the demo so the sample data lines up. */
export const now = () => (dbConfigured() ? new Date() : DEMO_TODAY);
