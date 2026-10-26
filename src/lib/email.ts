import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { isPreview } from "./clock";

// Email goes out from the info@ Gmail (Google Workspace) itself — SMTP_USER + SMTP_PASS (a Google app password) in Vercel,
// no domain setup needed. Resend (RESEND_API_KEY) is the other option. Keys live in Vercel, never in the code.
const smtpOn = () => !!(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
// Preview never emails anyone (real customers or otherwise) from the business address.
export const emailReady = () => !isPreview() && (smtpOn() || !!process.env.RESEND_API_KEY);
const FROM = () => process.env.EMAIL_FROM ?? "Meidan — MD Golden Builders <info@mdgoldenbuilders.com>";

let transport: Transporter | undefined;
const gmail = () =>
  (transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com", // SMTP_HOST / SMTP_PORT: only for local testing against a stand-in
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: { user: process.env.SMTP_USER!.trim(), pass: process.env.SMTP_PASS!.replace(/\s+/g, "") }, // Google shows the app password in groups of 4
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
  }));

export async function sendEmail(to: string, subject: string, html: string, replyTo = "info@mdgoldenbuilders.com") {
  if (!emailReady()) throw new Error("Email isn't connected here.");
  if (smtpOn()) {
    try {
      // Gmail only sends as its own address, so the sender is the SMTP account.
      await gmail().sendMail({ from: { name: "Meidan — MD Golden Builders", address: process.env.SMTP_USER!.trim() }, to, subject, html, replyTo });
    } catch (e) {
      const m = (e as Error).message;
      throw new Error(/Invalid login|535|534|Username and Password not accepted/i.test(m) ? "Gmail didn't accept the app password — check SMTP_USER / SMTP_PASS in Vercel." : `Email service: ${m.slice(0, 160)}`);
    }
    return;
  }
  const res = await fetch(process.env.RESEND_API_URL ?? "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM(), to: [to], subject, html, reply_to: replyTo }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Email service: ${res.status} ${(await res.text()).slice(0, 160)}`);
}
