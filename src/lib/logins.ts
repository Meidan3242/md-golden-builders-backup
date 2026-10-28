import "server-only";
import { cache } from "react";
import { dbConfigured } from "./clock";
import { migrate, schemaVersion, sql } from "./db";

/** Sessions issued before this moment are no longer accepted (set by "log out everywhere" and password changes). */
export const validAfter = cache(async (userId: string): Promise<number> => {
  if (!dbConfigured() || ((await schemaVersion()) ?? 0) < 6) return 0;
  const [r] = await sql()`select valid_after from app_logins where user_id = ${userId}`;
  return r ? new Date(r.valid_after).getTime() : 0;
});

export async function cutSessions(userId: string) {
  await sql()`insert into app_logins (user_id, valid_after) values (${userId}, ${new Date()})
              on conflict (user_id) do update set valid_after = excluded.valid_after`;
}

/** This one login was ended with "Log out" (sessions without an id predate this and can only be cut with "log out everywhere"). */
export const isRevoked = cache(async (sid: string | undefined): Promise<boolean> => {
  if (!sid || !dbConfigured() || ((await schemaVersion()) ?? 0) < 11) return false;
  const [r] = await sql()`select 1 from revoked_sessions where sid = ${sid}`;
  return !!r;
});

/** "Log out" ends this login on the server too — a copied cookie stops working. */
export async function revokeSession(sid: string, userId: string, exp: number) {
  if (!dbConfigured()) return;
  if (((await schemaVersion()) ?? 0) < 11) await migrate();
  await sql()`insert into revoked_sessions (sid, user_id, expires_at) values (${sid}, ${userId}, ${new Date(exp)}) on conflict (sid) do nothing`;
  await sql()`delete from revoked_sessions where expires_at < now()`; // expired cookies are rejected anyway
}
