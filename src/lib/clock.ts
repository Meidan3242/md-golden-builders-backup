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

/**
 * A Vercel Preview deployment (VERCEL_ENV is set by Vercel). Previews never touch production: they read only
 * PREVIEW_* variables (their own test database and test logins) and production services stay off,
 * even if a production variable is also visible to Preview.
 */
export const isPreview = () => process.env.VERCEL_ENV === "preview";

export const databaseUrl = () => (isPreview() ? process.env.PREVIEW_POSTGRES_URL : envSuffix("POSTGRES_URL", "DATABASE_URL"));

/** Supabase (logins + older file storage): the test project in Preview, the real one otherwise. */
export const supabaseUrl = () => (isPreview() ? process.env.PREVIEW_SUPABASE_URL : envSuffix("SUPABASE_URL"));
export const supabaseKey = () => (isPreview() ? process.env.PREVIEW_SUPABASE_SERVICE_ROLE_KEY : envSuffix("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"));

/** True once the real database is connected (Vercel ↔ Supabase sets POSTGRES_URL). */
export const dbConfigured = () => !!databaseUrl();

/** "Now" for the app: the real clock with real data; a fixed day in the demo so the sample data lines up. */
export const now = () => (dbConfigured() ? new Date() : DEMO_TODAY);
