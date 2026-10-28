"use client";

import clsx from "clsx";
import { Mail, MessageSquare, NotebookPen } from "lucide-react";
import { useState } from "react";
import { sendLeadMessage } from "@/app/actions/messages";

type Mode = "text" | "email" | "log";

/** Write to the customer (text from your phone, or email from the business Gmail), or write down their reply / a call. */
export function ConversationReply({ leadId, phone, email, emailOn }: { leadId: string; phone: string; email?: string; emailOn: boolean }) {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [from, setFrom] = useState<"customer" | "us">("customer");
  const [channel, setChannel] = useState("Text");
  const [msg, setMsg] = useState<{ ok: boolean; msg: string }>();
  const [pending, setPending] = useState(false);
  const digits = phone.replace(/[^0-9+]/g, "");
  const canEmail = emailOn && !!email;

  const send = () => {
    if (!text.trim()) return setMsg({ ok: false, msg: "Write the message first." });
    if (mode === "text") {
      // iPhone wants "&body=", Android "?body=".
      const sep = /iPhone|iPad|Macintosh/.test(navigator.userAgent) ? "&" : "?";
      window.location.href = `sms:${digits}${sep}body=${encodeURIComponent(text)}`;
    }
    setPending(true);
    setMsg(undefined);
    sendLeadMessage(leadId, { how: mode, text, from, channel })
      .then((r) => {
        setMsg(r);
        if (r.ok) setText("");
      }, () => setMsg({ ok: false, msg: "Something went wrong — please try again." }))
      .finally(() => setPending(false));
  };

  const tab = (m: Mode, label: string, Icon: typeof Mail, disabled = false, title = "") => (
    <button type="button" disabled={disabled} title={title} onClick={() => { setMode(m); setMsg(undefined); }}
      className={clsx("flex items-center gap-1 rounded-full px-2.5 py-1 font-medium disabled:opacity-40", mode === m ? "gold-gradient text-black" : "border border-border")}>
      <Icon className="size-3" /> {label}
    </button>
  );

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
        {tab("text", "Text", MessageSquare, !digits, !digits ? "No phone number" : "")}
        {tab("email", "Email", Mail, !canEmail, !emailOn ? "Email isn't connected here" : !email ? "This lead has no email address" : "")}
        {tab("log", "Write down a reply / call", NotebookPen)}
      </div>
      {mode === "log" && (
        <div className="mb-2 flex flex-wrap gap-2 text-xs">
          <select value={from} onChange={(e) => setFrom(e.target.value as "customer" | "us")} className="rounded-lg border border-border bg-surface px-2 py-1.5">
            <option value="customer">From the customer</option>
            <option value="us">From us</option>
          </select>
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded-lg border border-border bg-surface px-2 py-1.5">
            {["Text", "Call", "Email", "Thumbtack", "Yelp"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2}
          placeholder={mode === "text" ? "Write a text…" : mode === "email" ? `Email to ${email ?? ""}…` : "What did they say? / call notes…"}
          className="min-w-0 flex-1 rounded-2xl border border-border bg-surface px-4 py-2 text-sm" />
        <button type="button" disabled={pending} onClick={send} className="gold-gradient shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
          {pending ? "…" : mode === "log" ? "Save" : "Send"}
        </button>
      </div>
      {!msg && mode === "text" && <p className="mt-1.5 text-[11px] text-muted">Opens your phone&apos;s Messages with the text ready, and keeps a copy here.</p>}
      {msg && <p className={clsx("mt-1.5 text-xs", msg.ok ? "text-ok" : "text-bad")}>{msg.msg}</p>}
    </div>
  );
}
