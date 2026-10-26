import "server-only";
import { dbConfigured } from "./clock";
import { migrate, schemaVersion, sql } from "./db";

// Guessing passwords is slowed down per email + IP (so someone else can't lock Meidan or Laline out from their
// own computer), and per IP overall. Counts only failures in the last 15 minutes; a good login clears them.
export const WINDOW_MIN = 15;
export const MAX_PER_EMAIL_IP = 5;
export const MAX_PER_IP = 20;

/** Pure rule, kept separate so it can be tested: is this attempt blocked? */
export const isLocked = (failsEmailIp: number, failsIp: number) => failsEmailIp >= MAX_PER_EMAIL_IP || failsIp >= MAX_PER_IP;

async function ready() {
  if (!dbConfigured()) return false;
  if (((await schemaVersion()) ?? 0) < 11) await migrate();
  return true;
}

export async function loginBlocked(email: string, ip: string): Promise<boolean> {
  try {
    if (!(await ready())) return false;
    const since = new Date(Date.now() - WINDOW_MIN * 60_000);
    const [r] = await sql()`select
      count(*) filter (where email = ${email} and ip = ${ip})::int as email_ip,
      count(*)::int as ip
      from login_attempts where ip = ${ip} and not ok and at > ${since}`;
    return isLocked(r.email_ip, r.ip);
  } catch (e) {
    console.error("login guard unavailable", e);
    return false; // never lock everyone out because the counter is down
  }
}

export async function recordLogin(email: string, ip: string, ok: boolean) {
  try {
    if (!(await ready())) return;
    if (ok) await sql()`delete from login_attempts where email = ${email} and ip = ${ip} and not ok`;
    else await sql()`insert into login_attempts (email, ip, ok) values (${email}, ${ip}, false)`;
    await sql()`delete from login_attempts where at < now() - interval '1 day'`;
  } catch (e) {
    console.error("login guard unavailable", e);
  }
}
