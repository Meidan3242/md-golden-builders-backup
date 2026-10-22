import "server-only";
import type { TransactionSql } from "postgres";

/** What happens after an estimate goes out — human messages only, nothing is sent automatically. */
export const FOLLOW_UP_PLAN = [
  { step: "Day 1", days: 1, action: "Call + text: did you get the estimate? Offer a second meeting", who: "u-office" },
  { step: "Day 3", days: 3, action: "Call + text: answer questions, book second meeting", who: "u-office" },
  { step: "Day 7", days: 7, action: "Text check-in (Laline)", who: "u-office" },
  { step: "Day 14", days: 14, action: "Your message: crew available — Meidan sends from his phone", who: "u-owner" },
  { step: "Day 30", days: 30, action: "Last friendly check-in (Laline)", who: "u-office" },
];

/** The lead moves to "Estimate Sent" with the amount, and the follow-up reminders are scheduled (once). */
export async function recordEstimateSent(tx: TransactionSql, leadId: string, amount: number, byUser: string, text: string, pdf: string | null = null) {
  const sentAt = new Date();
  await tx`update leads set stage = 'Estimate Sent', estimate_amount = ${amount}, estimate_sent_at = ${sentAt},
           estimate_pdf = coalesce(${pdf}, estimate_pdf), closed_at = null, updated_at = now() where id = ${leadId}`;
  await tx`insert into lead_activity (lead_id, by_user, kind, text) values (${leadId}, ${byUser}, 'estimate', ${text})`;
  const [{ open }] = await tx`select count(*)::int as open from follow_ups where lead_id = ${leadId} and not done`;
  if (open) return; // a resend doesn't start the reminders over
  for (const s of FOLLOW_UP_PLAN) {
    await tx`insert into follow_ups (lead_id, step, due, action, assigned_to)
             values (${leadId}, ${s.step}, ${new Date(sentAt.getTime() + s.days * 86_400_000)}, ${s.action}, ${s.who})`;
  }
}
