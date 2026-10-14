// Signed login session (HMAC-SHA256). Works in middleware (Edge) and on the server (Node).
// Cookie value: base64url(payload) + "." + base64url(signature). Nothing secret is stored in it.

export const SESSION_COOKIE = "mdg_session";
export const VIEW_AS_COOKIE = "view_as"; // owner only: preview the app as another role
export const SESSION_DAYS = 30;

type Payload = { u: string; exp: number; v: string };

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
async function passwordVersion(userId: string, secret: string) {
  const pw = PASSWORD_ENV[userId] ? envAnyCase(PASSWORD_ENV[userId]) : undefined;
  if (!pw) return null;
  const h = await crypto.subtle.digest("SHA-256", enc.encode(`${secret}:${userId}:${pw}`));
  return b64url(h).slice(0, 16);
}

export async function signSession(userId: string, secret: string) {
  const v = (await passwordVersion(userId, secret)) ?? "";
  const body = b64url(enc.encode(JSON.stringify({ u: userId, exp: Date.now() + SESSION_DAYS * 86_400_000, v } satisfies Payload)));
  const sig = await crypto.subtle.sign("HMAC", await key(secret), enc.encode(body));
  return `${body}.${b64url(sig)}`;
}

/** Returns the user id if the cookie is genuine and not expired. */
export async function verifySession(token: string | undefined, secret: string | null): Promise<string | null> {
  if (!token || !secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(secret), fromB64url(sig), enc.encode(body));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body))) as Payload;
    if (p.exp <= Date.now()) return null;
    const v = await passwordVersion(p.u, secret);
    return v && v === p.v ? p.u : null; // password changed or removed → logged out
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

/** Each person's password comes from a Vercel environment variable — never from the code. */
export const PASSWORD_ENV: Record<string, string> = {
  "u-owner": "PASS_MEIDAN",
  "u-office": "PASS_LALINE",
  "u-rep": "PASS_SALES",
  "u-pm": "PASS_PM",
};
