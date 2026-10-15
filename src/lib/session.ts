// Signed login session (HMAC-SHA256). Works in middleware (Edge) and on the server (Node).
// Cookie value: base64url(payload) + "." + base64url(signature). Nothing secret is stored in it.

export const SESSION_COOKIE = "mdg_session";
export const SESSION_DAYS = 30;

// u = user, exp = expiry, v = which login it came from (see below), iat = when it was issued.
type Payload = { u: string; exp: number; v: string; iat?: number };

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function key(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export function authSecret() {
  const s = envAnyCase("AUTH_SECRET");
  return s && s.length >= 16 ? s : null;
}

/**
 * A short fingerprint of the person's current password. It's inside the session, so changing or
 * deleting that password in Vercel logs that person out everywhere, right away.
 */
async function passwordVersion(userId: string, secret: string, v?: string) {
  // Account login (Supabase Auth): tied to AUTH_SECRET; per-person log-out is checked against the database.
  if (v?.startsWith("a.")) return `a.${b64url(await crypto.subtle.digest("SHA-256", enc.encode(`${secret}:${userId}:account`))).slice(0, 16)}`;
  const pw = PASSWORD_ENV[userId] ? envAnyCase(PASSWORD_ENV[userId]) : undefined;
  if (!pw) return null;
  const h = await crypto.subtle.digest("SHA-256", enc.encode(`${secret}:${userId}:${pw}`));
  return b64url(h).slice(0, 16);
}

export async function signSession(userId: string, secret: string, account = true) {
  const v = (await passwordVersion(userId, secret, account ? "a." : undefined)) ?? "";
  const body = b64url(enc.encode(JSON.stringify({ u: userId, exp: Date.now() + SESSION_DAYS * 86_400_000, v, iat: Date.now() } satisfies Payload)));
  const sig = await crypto.subtle.sign("HMAC", await key(secret), enc.encode(body));
  return `${body}.${b64url(sig)}`;
}

/** Returns the user id if the cookie is genuine and not expired. */
export async function verifySession(token: string | undefined, secret: string | null): Promise<string | null> {
  return (await readSession(token, secret))?.u ?? null;
}

/** The session's user and when it was issued (0 for sessions from before this was recorded). */
export async function readSession(token: string | undefined, secret: string | null): Promise<{ u: string; iat: number } | null> {
  if (!token || !secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(secret), fromB64url(sig), enc.encode(body));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body))) as Payload;
    if (p.exp <= Date.now()) return null;
    const v = await passwordVersion(p.u, secret, p.v);
    return v && v === p.v ? { u: p.u, iat: p.iat ?? 0 } : null; // old password changed or removed → logged out
  } catch {
    return null;
  }
}

/** Read an env var by name, ignoring upper/lower case (e.g. "pass_Laline" works for PASS_LALINE). */
export function envAnyCase(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  const k = Object.keys(process.env).find((x) => x.toUpperCase() === name.toUpperCase());
  return k ? process.env[k] : undefined;
}

/**
 * The old shared passwords (Vercel env). Only for Meidan and Laline, and only until each of them sets an
 * account password — then their old sessions are cut and this login is refused.
 */
export const PASSWORD_ENV: Record<string, string> = {
  "u-owner": "PASS_MEIDAN",
  "u-office": "PASS_LALINE",
};
