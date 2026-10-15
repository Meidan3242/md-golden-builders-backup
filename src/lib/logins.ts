import "server-only";
import { cache } from "react";
import { dbConfigured } from "./clock";
import { schemaVersion, sql } from "./db";

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
