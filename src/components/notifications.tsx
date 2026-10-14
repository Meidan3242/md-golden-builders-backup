"use client";

import { Bell, BellRing, Share } from "lucide-react";
import { useEffect, useState } from "react";

type Note = { title: string; body: string; url: string };
type State = "loading" | "unsupported" | "needs-home-screen" | "off" | "on" | "blocked";

async function registration() {
  return navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready);
}

/** Turn on phone notifications and preview the 8:00 AM morning one (and a follow-up reminder). */
export function MorningNotifications({ morning, reminder }: { morning: Note; reminder?: Note }) {
  const [state, setState] = useState<State>("loading");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    if (!("serviceWorker" in navigator) || !("Notification" in window)) setState(ios && !standalone ? "needs-home-screen" : "unsupported");
    else if (Notification.permission === "granted") setState("on");
    else if (Notification.permission === "denied") setState("blocked");
    else setState("off");
  }, []);

  const show = async (n: Note) => {
    const reg = await registration();
    await reg.showNotification(n.title, { body: n.body, icon: "/icon-192.png", badge: "/icon-192.png", data: { url: n.url } });
  };

  const turnOn = async () => {
    const p = await Notification.requestPermission();
    if (p !== "granted") return setState(p === "denied" ? "blocked" : "off");
    setState("on");
    await show(morning);
    setSent(true);
  };

  const test = async () => {
    await show(morning);
    if (reminder) setTimeout(() => show(reminder), 4000);
    setSent(true);
  };

  if (state === "loading") return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 font-semibold">
        {state === "on" ? <BellRing className="size-4 text-gold-text" /> : <Bell className="size-4 text-gold-text" />} Morning notification · 8:00 AM
      </div>
      <p className="mt-1 text-xs text-muted">Every morning: who to send a follow-up to, today&apos;s meetings, estimates waiting. Tap it and the right screen opens.</p>

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
        <button onClick={turnOn} className="gold-gradient mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-black">Turn on notifications</button>
      )}
      {state === "on" && (
        <button onClick={test} className="mt-3 w-full rounded-xl border border-gold py-2.5 text-sm font-semibold text-gold-text">
          {sent ? "Sent ✓ — send again" : "Send me a test now"}
        </button>
      )}
    </div>
  );
}
