"use client";

import { Bell, BellRing, Share } from "lucide-react";
import { useEffect, useState } from "react";
import { pushKey, subscribePush, testPush } from "@/app/actions/push";

type State = "loading" | "unsupported" | "needs-home-screen" | "off" | "on" | "blocked";

async function registration() {
  return navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready);
}

const toBytes = (b64: string) => {
  const s = atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};

/** Signs this phone / computer up with the server, so notifications arrive even when the app is closed. */
async function signUp(): Promise<string> {
  const key = await pushKey();
  if (!key) return "Failed: the database isn't connected.";
  const reg = await registration();
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(key) }));
  return subscribePush(sub.toJSON() as Parameters<typeof subscribePush>[0]);
}

/** Phone notifications: a customer opened or approved an estimate. */
export function PhoneNotifications() {
  const [state, setState] = useState<State>("loading");
  const [msg, setMsg] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    if (!("serviceWorker" in navigator) || !("Notification" in window) || !("PushManager" in window)) setState(ios && !standalone ? "needs-home-screen" : "unsupported");
    else if (Notification.permission === "granted") {
      setState("on");
      signUp().catch(() => {}); // keeps this device signed up (iPhone sometimes drops it)
    } else if (Notification.permission === "denied") setState("blocked");
    else setState("off");
  }, []);

  const run = async (f: () => Promise<string>) => {
    setBusy(true);
    setMsg(undefined);
    try {
      setMsg(await f());
    } catch (e) {
      setMsg(`Failed: ${(e as Error).message || "try again"}`);
    } finally {
      setBusy(false);
    }
  };

  const turnOn = () =>
    run(async () => {
      const p = await Notification.requestPermission();
      if (p !== "granted") {
        setState(p === "denied" ? "blocked" : "off");
        return "Failed: notifications weren't allowed.";
      }
      setState("on");
      const r = await signUp();
      return r.startsWith("Failed") ? r : testPush();
    });

  if (state === "loading") return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 font-semibold">
        {state === "on" ? <BellRing className="size-4 text-gold-text" /> : <Bell className="size-4 text-gold-text" />} Phone notifications
      </div>
      <p className="mt-1 text-xs text-muted">When a customer opens your estimate, opens it again, or approves it. Tap the notification and the estimate opens. Turn it on on each phone / computer.</p>

      {state === "needs-home-screen" && (
        <div className="mt-3 rounded-xl bg-surface p-3 text-sm">
          <b>First, put the app on your Home Screen:</b>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-xs text-muted">
            <li>In Safari tap <Share className="inline size-3.5" /> Share</li>
            <li>Tap <b>Add to Home Screen</b></li>
            <li>Open MD Golden from the Home Screen and come back here</li>
          </ol>
        </div>
      )}
      {state === "unsupported" && <p className="mt-3 text-xs text-muted">This browser can&apos;t show notifications.</p>}
      {state === "blocked" && <p className="mt-3 text-xs text-bad">Notifications are blocked. iPhone: Settings → Notifications → MD Golden → Allow.</p>}
      {state === "off" && (
        <button onClick={turnOn} disabled={busy} className="gold-gradient mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-black disabled:opacity-60">{busy ? "Turning on…" : "Turn on notifications"}</button>
      )}
      {state === "on" && (
        <button onClick={() => run(async () => { const r = await signUp(); return r.startsWith("Failed") ? r : testPush(); })} disabled={busy} className="mt-3 w-full rounded-xl border border-gold py-2.5 text-sm font-semibold text-gold-text disabled:opacity-60">
          {busy ? "Sending…" : "Send me a test notification"}
        </button>
      )}
      {msg && <p className={`mt-2 text-xs ${msg.startsWith("Failed") ? "text-bad" : "text-ok"}`}>{msg}</p>}
    </div>
  );
}
