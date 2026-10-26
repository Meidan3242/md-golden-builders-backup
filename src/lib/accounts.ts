import "server-only";
import { supabaseKey, supabaseUrl } from "./clock";

/** The only people who can log in: their email → their user in the app. */
export const ACCOUNTS: Record<string, string> = {
  "meidan3242@gmail.com": "u-owner",
  "info@mdgoldenbuilders.com": "u-office",
};
export const userOfEmail = (email: string) => ACCOUNTS[email.trim().toLowerCase()];
export const emailOf = (userId: string) => Object.keys(ACCOUNTS).find((e) => ACCOUNTS[e] === userId);
export const MIN_PASSWORD = 10;

// Supabase Auth, called only from the server with the service key (never sent to the browser).
const base = supabaseUrl;
const key = supabaseKey;
export const authReady = () => !!(base() && key());

async function call(path: string, init: { method?: string; body?: unknown; admin?: boolean } = {}) {
  const k = key()!;
  const headers: Record<string, string> = { apikey: k, "Content-Type": "application/json" };
  // Legacy JWT keys also go in Authorization; new "sb_secret_…" keys are sent as apikey only.
  if (init.admin && !k.startsWith("sb_")) headers.Authorization = `Bearer ${k}`;
  const res = await fetch(`${base()}/auth/v1${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, json };
}

/** True when Supabase accepts this email + password. */
export async function checkPassword(email: string, password: string) {
  if (!authReady() || !userOfEmail(email)) return false;
  const r = await call("/token?grant_type=password", { method: "POST", body: { email: email.trim().toLowerCase(), password } });
  return r.ok && !!r.json.access_token;
}

type AuthUser = { id: string; email?: string };
export async function findAccount(email: string): Promise<AuthUser | null> {
  if (!authReady()) return null;
  const r = await call("/admin/users?page=1&per_page=1000", { admin: true });
  if (!r.ok) throw new Error(`Supabase Auth ${r.status}: ${String(r.json.msg ?? r.json.message ?? r.json.error ?? "")}`);
  const users = (r.json.users ?? []) as AuthUser[];
  return users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase()) ?? null;
}

/** Create the account, or give it a new password. Only for the two allowed emails. */
export async function setAccountPassword(email: string, password: string) {
  const e = email.trim().toLowerCase();
  if (!userOfEmail(e)) throw new Error("Not an allowed account");
  const existing = await findAccount(e);
  const r = existing
    ? await call(`/admin/users/${existing.id}`, { method: "PUT", admin: true, body: { password } })
    : await call("/admin/users", { method: "POST", admin: true, body: { email: e, password, email_confirm: true } });
  if (!r.ok) throw new Error(String(r.json.msg ?? r.json.message ?? r.json.error_description ?? r.json.error ?? `Supabase Auth ${r.status}`));
}
