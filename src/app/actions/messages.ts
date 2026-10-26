"use server";

import { revalidatePath } from "next/cache";
import { leadForChange } from "@/lib/data";
import { dbReady, sql } from "@/lib/db";
import { emailReady, sendEmail } from "@/lib/email";

const CHANNELS = ["Text", "Call", "Email", "Thumbtack", "Yelp"] as const;
type Channel = (typeof CHANNELS)[number];
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * The lead's conversation:
 * - "email": sent to the customer from the business Gmail, and kept in the conversation.
 * - "text":  the team texted from their phone (the app opens the phone's Messages) — kept in the conversation.
 * - "log":   write down what happened elsewhere (the customer's reply, a call, a Thumbtack/Yelp message).
 */
export async function sendLeadMessage(leadId: string, m: { how: "email" | "text" | "log"; text: string; from?: "us" | "customer"; channel?: string }): Promise<{ ok: boolean; msg: string }> {
  const no = (msg: string) => ({ ok: false, msg });
  try {
    const { user, lead } = await leadForChange(leadId);
    if (!(await dbReady())) return no("Demo mode — this saves for real once the database is connected.");
    const text = String(m.text ?? "").trim().slice(0, 4000);
    if (!text) return no("Write the message first.");
    let channel: Channel = "Text";
    let sender: "us" | "customer" = "us";
    if (m.how === "email") {
      if (!emailReady()) return no("Email isn't connected here.");
      if (!lead.email || !/^\S+@\S+\.\S+$/.test(lead.email)) return no("This lead has no email address.");
      await sendEmail(
        lead.email,
        "MD Golden Builders",
        `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.5;color:#1c1c1e;max-width:520px">
          <p>${esc(text).replace(/\n/g, "<br>")}</p>
          <p>${esc(user.name)}<br>MD Golden Builders · CSLB #1128874<br>(858) 933-1694</p>
        </div>`,
      );
      channel = "Email";
    } else if (m.how === "log") {
      channel = CHANNELS.includes(m.channel as Channel) ? (m.channel as Channel) : "Text";
      sender = m.from === "customer" ? "customer" : "us";
    }
    await sql()`insert into lead_messages (lead_id, sender, channel, text) values (${lead.id}, ${sender}, ${channel}, ${text})`;
    await sql()`update leads set updated_at = now() where id = ${lead.id}`;
    revalidatePath("/", "layout");
    return { ok: true, msg: m.how === "email" ? "Emailed ✓" : "Saved ✓" };
  } catch (e) {
    return no(`Failed: ${(e as Error).message}`);
  }
}
