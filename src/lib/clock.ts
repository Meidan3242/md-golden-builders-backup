import { TODAY as DEMO_TODAY } from "./demo-data";

/** True once the real database is connected (Vercel ↔ Supabase sets POSTGRES_URL). */
export const dbConfigured = () => !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);

/** "Now" for the app: the real clock with real data; a fixed day in the demo so the sample data lines up. */
export const now = () => (dbConfigured() ? new Date() : DEMO_TODAY);
