"use server";

import { currentUser } from "@/lib/data";
import { dbReady } from "@/lib/db";
import { pushTo, savePushSubscription, vapidKeys } from "@/lib/push";

/** The public key the phone needs to sign up for notifications. */
export async function pushKey(): Promise<string | null> {
  await currentUser();
  if (!(await dbReady())) return null;
  return (await vapidKeys()).publicKey;
}

/** This phone / computer gets the notifications of the logged-in person. */
export async function subscribePush(sub: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }): Promise<string> {
  const u = await currentUser();
  const endpoint = String(sub?.endpoint ?? "");
  const p256dh = String(sub?.keys?.p256dh ?? ""), auth = String(sub?.keys?.auth ?? "");
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !p256dh || !auth || p256dh.length > 200 || auth.length > 100) return "Failed: this browser didn't give a valid subscription.";
  if (!(await dbReady())) return "Failed: the database isn't connected.";
  await savePushSubscription(u.id, { endpoint, keys: { p256dh, auth } });
  return "Done ✓";
}

/** A real notification from the server to all of this person's devices — proves the whole path works. */
export async function testPush(): Promise<string> {
  const u = await currentUser();
  const n = await pushTo([u.id], { title: "MD Golden Builders ✓", body: "Notifications work. You'll get one when a customer opens or approves an estimate.", url: "/" });
  return n ? `Done ✓ sent to ${n} device${n === 1 ? "" : "s"}` : "Failed: no device is signed up yet — tap Turn on notifications.";
}
