import "server-only";
import webpush from "web-push";
import { migrate, schemaVersion, sql } from "./db";
import { USERS } from "./demo-data";

// Real phone notifications (Web Push). The signing keys are made once and kept in the database
// (or VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in Vercel, if set), so there is nothing to set up.
export type Push = { title: string; body: string; url: string };

export const pushReady = async () => ((await schemaVersion()) ?? 0) >= 9;
async function ensure() {
  if (!(await pushReady())) await migrate();
}

let keys: Promise<{ publicKey: string; privateKey: string }> | undefined;
export function vapidKeys() {
  keys ??= (async () => {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) return { publicKey: process.env.VAPID_PUBLIC_KEY.trim(), privateKey: process.env.VAPID_PRIVATE_KEY.trim() };
    const [r] = await sql()`select value from app_settings where key = 'vapid'`;
    if (r) return r.value as { publicKey: string; privateKey: string };
    const { publicKey, privateKey } = webpush.generateVAPIDKeys();
    const fresh = { publicKey, privateKey };
    await sql()`insert into app_settings (key, value) values ('vapid', ${sql().json(fresh)}) on conflict (key) do nothing`;
    const [saved] = await sql()`select value from app_settings where key = 'vapid'`; // two at once: both use the first one saved
    return saved.value as { publicKey: string; privateKey: string };
  })().catch((e) => {
    keys = undefined;
    throw e;
  });
  return keys;
}

export async function savePushSubscription(userId: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  await ensure();
  await sql()`insert into push_subscriptions (endpoint, user_id, p256dh, auth) values (${sub.endpoint}, ${userId}, ${sub.keys.p256dh}, ${sub.keys.auth})
    on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`;
}

/** Sends to every phone/computer of these people. Dead subscriptions (app removed, permission off) are deleted. Returns how many got it. */
export async function pushTo(userIds: string[], n: Push): Promise<number> {
  if (!(await pushReady()) || !userIds.length) return 0;
  const subs = await sql()`select endpoint, p256dh, auth from push_subscriptions where user_id in ${sql()(userIds)}`;
  if (!subs.length) return 0;
  const k = await vapidKeys();
  const payload = JSON.stringify(n);
  const sent = await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
          vapidDetails: { subject: "mailto:info@mdgoldenbuilders.com", publicKey: k.publicKey, privateKey: k.privateKey },
          TTL: 86_400,
          timeout: 10_000,
        });
        return 1;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await sql()`delete from push_subscriptions where endpoint = ${s.endpoint}`;
        else console.error("push failed", code, (e as Error).message);
        return 0;
      }
    }),
  );
  return sent.reduce<number>((a, b) => a + b, 0);
}

/** The owner and the office (they handle estimates). */
export const pushToTeam = (n: Push) => pushTo(USERS.filter((u) => u.role === "admin" || u.role === "office").map((u) => u.id), n);
