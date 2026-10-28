"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ACCOUNTS, authReady, checkPassword, emailOf, findAccount, MIN_PASSWORD, setAccountPassword, userOfEmail } from "@/lib/accounts";
import { loggedInUser } from "@/lib/data";
import { migrate } from "@/lib/db";
import { loginBlocked, recordLogin } from "@/lib/login-guard";
import { cutSessions, revokeSession } from "@/lib/logins";
import { authSecret, envAnyCase, PASSWORD_ENV, readSession, SESSION_COOKIE, SESSION_DAYS, signSession } from "@/lib/session";

const sha = (s: string) => createHash("sha256").update(s).digest();
const sameSecret = (a: string, b: string) => timingSafeEqual(sha(a), sha(b));
const slow = () => new Promise((r) => setTimeout(r, 800)); // slows down guessing

async function startSession(userId: string, account: boolean) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(userId, authSecret()!, account), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  jar.delete("view_as"); // leftover from the removed preview switcher
}

/** Email + password. Only Meidan's and Laline's emails can log in. */
export async function login(_: string | null, form: FormData): Promise<string | null> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/");
  const userId = userOfEmail(email);
  if (!authSecret()) return "Login isn't set up yet (AUTH_SECRET is missing in Vercel).";
  const ip = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0]!.trim() || "unknown";
  if (await loginBlocked(email, ip)) {
    await slow();
    return "Too many tries — wait 15 minutes and try again.";
  }
  if (!userId || !password) {
    await recordLogin(email, ip, false);
    await slow();
    return "Wrong email or password.";
  }
  const old = PASSWORD_ENV[userId] ? envAnyCase(PASSWORD_ENV[userId]) : undefined;
  const oldMatches = !!old && sameSecret(password, old);
  let ok = false;
  let account = true;
  try {
    ok = await checkPassword(email, password);
    // Before an account password is set, the old shared password still opens the door (setting the account
    // password cuts every old session and turns this off).
    if (!ok && oldMatches && !(await findAccount(email))) (ok = true), (account = false);
  } catch {
    // Login service unreachable: the old password (while it still exists in Vercel) keeps the owner from being locked out.
    if (!oldMatches) return "Can't reach the login service right now — try again in a minute.";
    (ok = true), (account = false);
  }
  if (!ok) {
    await recordLogin(email, ip, false);
    await slow();
    return "Wrong email or password.";
  }
  await recordLogin(email, ip, true);
  await startSession(userId, account);
  redirect(next.startsWith("/") && !next.startsWith("//") && next !== "/" ? next : "/");
}

export async function logout() {
  const jar = await cookies();
  const s = await readSession(jar.get(SESSION_COOKIE)?.value, authSecret());
  if (s?.sid) {
    try {
      await revokeSession(s.sid, s.u, s.exp); // a copy of this cookie stops working too
    } catch (e) {
      console.error("could not end the session on the server", e);
    }
  }
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

/**
 * Set a password. The owner can set either person's; anyone can set their own (with the current password).
 * Every older session of that person is logged out.
 */
export async function setPassword(_: string | null, form: FormData): Promise<string | null> {
  const me = await loggedInUser();
  if (!me) return "Please log in again.";
  const target = String(form.get("user") ?? me.id);
  const email = emailOf(target);
  if (!email) return "This person has no login.";
  if (target !== me.id && me.role !== "admin") return "Only the owner can do this.";
  const pw = String(form.get("password") ?? "");
  if (pw.length < MIN_PASSWORD) return `At least ${MIN_PASSWORD} characters.`;
  if (pw !== String(form.get("confirm") ?? "")) return "The two passwords don't match.";
  if (!authReady()) return "Supabase isn't connected.";
  try {
    if (target === me.id && (await findAccount(email))) {
      const current = String(form.get("current") ?? "");
      if (!(await checkPassword(email, current))) {
        await slow();
        return "Your current password is wrong.";
      }
    }
    await migrate(); // creates the log-out table the first time
    await setAccountPassword(email, pw);
    await cutSessions(target);
    if (target === me.id) await startSession(me.id, true); // keep this phone logged in
  } catch (e) {
    return `Failed: ${(e as Error).message}`;
  }
  return target === me.id ? "Done ✓ Your new password is set." : "Done ✓ Password set — they were logged out everywhere.";
}

/** Owner: log someone out of every phone and computer right now. */
export async function logOutEverywhere(userId: string): Promise<string> {
  const me = await loggedInUser();
  if (me?.role !== "admin") return "Only the owner can do this.";
  if (!Object.values(ACCOUNTS).includes(userId) || userId === me.id) return "Not possible.";
  await migrate();
  await cutSessions(userId);
  return "Done ✓ Logged out everywhere.";
}
