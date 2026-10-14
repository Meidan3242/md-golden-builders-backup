"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { USERS } from "@/lib/demo-data";
import { authSecret, PASSWORD_ENV, SESSION_COOKIE, SESSION_DAYS, signSession, verifySession, VIEW_AS_COOKIE } from "@/lib/session";

const sha = (s: string) => createHash("sha256").update(s).digest();
const sameSecret = (a: string, b: string) => timingSafeEqual(sha(a), sha(b));

export async function login(_: string | null, form: FormData): Promise<string | null> {
  const userId = String(form.get("user") ?? "");
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/");
  const secret = authSecret();
  const expected = PASSWORD_ENV[userId] ? process.env[PASSWORD_ENV[userId]] : undefined;
  if (!secret || !expected) return "Login isn't set up yet for this person.";
  if (!password || !sameSecret(password, expected)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return "Wrong password. Try again.";
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(userId, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  jar.delete(VIEW_AS_COOKIE);
  const role = USERS.find((u) => u.id === userId)?.role;
  const home = role === "pm" ? "/projects" : "/";
  redirect(next.startsWith("/") && !next.startsWith("//") && next !== "/" ? next : home);
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(VIEW_AS_COOKIE);
  redirect("/login");
}

/** Owner only: preview the app as another role (empty = back to himself). */
export async function viewAs(userId: string) {
  const jar = await cookies();
  const me = await verifySession(jar.get(SESSION_COOKIE)?.value, authSecret());
  if (me !== "u-owner") return;
  if (!userId || userId === me) jar.delete(VIEW_AS_COOKIE);
  else if (USERS.some((u) => u.id === userId)) jar.set(VIEW_AS_COOKIE, userId, { httpOnly: true, sameSite: "lax", path: "/" });
}
