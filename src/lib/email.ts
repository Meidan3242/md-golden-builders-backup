import "server-only";

// Email through Resend (free up to 3,000 a month). Key and sender live in Vercel, never in the code.
export const emailReady = () => !!process.env.RESEND_API_KEY;
const FROM = () => process.env.EMAIL_FROM ?? "Meidan — MD Golden Builders <info@mdgoldenbuilders.com>";

export async function sendEmail(to: string, subject: string, html: string, replyTo = "info@mdgoldenbuilders.com") {
  const res = await fetch(process.env.RESEND_API_URL ?? "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM(), to: [to], subject, html, reply_to: replyTo }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Email service: ${res.status} ${(await res.text()).slice(0, 160)}`);
}
