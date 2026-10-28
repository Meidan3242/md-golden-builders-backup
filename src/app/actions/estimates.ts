"use server";

import { randomUUID } from "node:crypto";
import type { TransactionSql } from "postgres";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";
import { canSeeAll, currentUser, getLead } from "@/lib/data";
import { migrate, schemaVersion, sql } from "@/lib/db";
import { emailReady, sendEmail } from "@/lib/email";
import { SAVED, totalOf } from "@/lib/estimate-math";
import type { EstimateJob, EstimateStage } from "@/lib/estimate-templates";
import { estimateContent, estimateVersion, UPDATED } from "@/lib/doc-version";
import { estimateById, estimateByToken, estimateFromRow, estimatesReady, newToken, PHOTO_ID } from "@/lib/estimates";
import { customerApproved } from "@/lib/estimate-notices";
import { recordEstimateSent } from "@/lib/lead-estimate";
import { money } from "@/lib/format";
import { putR2, r2Ready } from "@/lib/storage";
import { checkUpload } from "@/lib/upload-rules";

const LOCKS = async (tx: TransactionSql) => {
  await tx`set local lock_timeout = '8s'`; await tx`set local statement_timeout = '20s'`; await tx`set local idle_in_transaction_session_timeout = '30s'`; // never leave the database locked
};

/** Who may work on estimates: staff who can see this lead (never the project manager). */
async function canEdit(leadId: string | null) {
  const u = await currentUser();
  if (u.role === "pm") throw new Error("Not allowed");
  if (leadId ? !(await getLead(leadId)) : !canSeeAll(u)) throw new Error("Not allowed"); // no lead → owner / office only
  return u;
}

type Draft = {
  id?: string;
  leadId: string;
  customer: { name: string; email: string; phone: string; address: string };
  title: string;
  note: string;
  jobs: EstimateJob[];
  exclusions: string[];
  schedule: EstimateStage[];
  validDays: number;
};
const clean = (s: unknown, max = 2000) => String(s ?? "").trim().slice(0, max);
/** Size limits far above any real estimate (a 15-page scope is ~40,000 characters). */
const MAX = { title: 500, text: 50_000, jobs: 50, steps: 200, lines: 2_000, total: 400_000 };
/** A clear message instead of cutting anything off. */
function tooBig(d: Draft, jobs: EstimateJob[]): string | null {
  const over = (s: unknown, max: number) => String(s ?? "").trim().length > max;
  if (over(d.title, MAX.title) || jobs.length > MAX.jobs) return "That's more than an estimate can hold — split it into two estimates.";
  for (const j of d.jobs ?? []) {
    if (over(j.title, MAX.title)) return `The job name "${String(j.title).slice(0, 40)}…" is too long — keep names short and put the details in the steps.`;
    for (const x of j.steps ?? []) {
      if (over(x.title, MAX.title)) return `A step name in ${j.title || "a job"} is too long — put the details in the step's lines.`;
      if ((x.items ?? []).some((i) => over(i, MAX.text))) return `One line in ${j.title || "a job"} is extremely long — break it into a few lines.`;
    }
  }
  if (jobs.some((j) => j.steps.length > MAX.steps || j.steps.some((x) => x.items.length > MAX.lines))) return "That's more than an estimate can hold — split it into two estimates.";
  if (over(d.note, MAX.text) || (d.exclusions ?? []).some((x) => over(x, MAX.text))) return "The note is extremely long — shorten it a little.";
  if (JSON.stringify(jobs).length > MAX.total) return "That's more than an estimate can hold — split it into two estimates.";
  return null;
}

/** Save the estimate (new or edit). Approved estimates can't be changed. Returns an error to show, or SAVED + the id. */
export async function saveEstimate(_: string | null, form: FormData): Promise<string | null> {
  let d: Draft;
  try {
    d = JSON.parse(String(form.get("data")));
  } catch {
    return "Something went wrong — try again.";
  }
  const u = await canEdit(d.leadId);
  if (!(await estimatesReady())) await migrate();
  // Nothing the user writes is ever shortened. The caps below only stop absurd sizes (a pasted book) —
  // anything over them is refused with a message, never cut silently.
  const jobs = (d.jobs ?? [])
    .map((j) => ({
      title: clean(j.title, MAX.title),
      price: Math.max(0, Math.round(Number(j.price) || 0)),
      steps: (j.steps ?? [])
        .map((x) => ({
          title: clean(x.title, MAX.title),
          items: (x.items ?? []).map((i) => clean(i, MAX.text)).filter(Boolean),
          photos: (Array.isArray(x.photos) ? x.photos : []).filter((p) => PHOTO_ID.test(String(p))).slice(0, 8),
        }))
        .filter((x) => x.title || x.items.length || x.photos.length),
    }))
    .filter((j) => j.title || j.price || j.steps.length);
  const schedule = (d.schedule ?? []).map((x) => ({ name: clean(x.name, MAX.title), pct: Math.max(0, Number(x.pct) || 0) })).filter((x) => x.name || x.pct);
  const tooLong = tooBig(d, jobs);
  if (tooLong) return tooLong;
  if (!clean(d.customer?.name)) return "Add the customer's name.";
  if (!clean(d.title)) return "Add a title (what the job is).";
  if (!jobs.length) return "Add the work (at least one job).";
  if (jobs.some((j) => !j.title)) return "Every job needs a name (e.g. Pavers).";
  const unpriced = jobs.find((j) => !j.price);
  if (unpriced) return `Add the price for ${unpriced.title}.`;
  if (jobs.some((j) => !j.steps.length)) return "Every job needs at least one step.";
  const total = totalOf(jobs);
  const pct = schedule.reduce((a, x) => a + x.pct, 0);
  if (Math.round(pct) !== 100) return `The payment stages add up to ${pct}% — they need to be 100%.`;
  const values = {
    lead_id: d.leadId || null,
    customer: sql().json({ name: clean(d.customer.name, 120), email: clean(d.customer.email, 200), phone: clean(d.customer.phone, 40), address: clean(d.customer.address, 300) }),
    title: clean(d.title, MAX.title),
    note: clean(d.note, MAX.text),
    sections: sql().json(jobs), // the column keeps its old name; it holds the jobs
    exclusions: sql().json((d.exclusions ?? []).map((x) => clean(x, MAX.text)).filter(Boolean)),
    schedule: sql().json(schedule),
    total,
    valid_days: Math.min(90, Math.max(7, Number(d.validDays) || 30)),
  };
  let id = d.id;
  if (id) {
    const cur = await estimateById(id);
    if (!cur || cur.leadId !== (d.leadId || null)) return "Estimate not found.";
    if (cur.status === "Approved") return "This estimate was already approved — make a new one instead.";
    await sql()`update estimates set ${sql()(values)}, updated_at = now() where id = ${id}`;
  } else {
    id = `E-${randomUUID().slice(0, 8)}`;
    await sql()`insert into estimates ${sql()({ id, token: newToken(), created_by: u.id, ...values })}`;
  }
  // No redirect and no page refresh from here: the editor opens the saved estimate itself with a full page load (always
  // fresh). Refreshing the app's pages from this action sometimes left the screen stuck on "Saving…" after it had saved.
  return `${SAVED}${id}`;
}

/** The estimate goes out (link texted, copied or emailed): lead → Estimate Sent, follow-ups start. */
async function markSent(id: string) {
  const e = await estimateById(id);
  if (!e) throw new Error("Estimate not found.");
  const u = await canEdit(e.leadId);
  await sql().begin(async (tx) => {
    await LOCKS(tx);
    await tx`update estimates set status = case when status = 'Draft' then 'Sent' else status end, sent_at = coalesce(sent_at, now()) where id = ${id}`;
    if (e.leadId) await recordEstimateSent(tx, e.leadId, e.total, u.id, `Estimate #${e.number} sent — ${money(e.total)}`);
  });
  revalidatePath("/", "layout");
  return e;
}

export async function estimateSent(id: string): Promise<string> {
  try {
    await markSent(id);
    return "Done ✓";
  } catch (e) {
    return `Failed: ${(e as Error).message}`;
  }
}

const linkFor = async (token: string) => {
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}/e/${token}`;
};

export async function emailEstimate(id: string): Promise<string> {
  try {
    const e = await estimateById(id);
    if (!e) return "Failed: estimate not found.";
    await canEdit(e.leadId);
    if (!emailReady()) return "Failed: email isn't connected yet — use Text for now.";
    if (!/^\S+@\S+\.\S+$/.test(e.customer.email)) return "Failed: add the customer's email to the estimate first.";
    const first = e.customer.name.split(" ")[0];
    const link = await linkFor(e.token);
    await sendEmail(
      e.customer.email,
      `Your estimate from MD Golden Builders — ${e.title}`,
      `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.5;color:#1c1c1e;max-width:520px">
        <p>Hi ${first.replace(/[<>&]/g, "")},</p>
        <p>Thank you for having me over. Here is your estimate for <b>${e.title.replace(/[<>&]/g, "")}</b> — everything we talked about, with the price and the payment schedule.</p>
        <p style="margin:24px 0"><a href="${link}" style="background:#d4a73a;color:#000;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px">View your estimate</a></p>
        <p>Any question at all, just reply here or text me.</p>
        <p>Meidan<br>MD Golden Builders · CSLB #1128874<br>(858) 933-1694</p>
      </div>`,
    );
    await markSent(id);
    return "Done ✓ Emailed";
  } catch (err) {
    return `Failed: ${(err as Error).message}`;
  }
}

/**
 * Customer side (public, by private link): approve the estimate with their name — only the exact version
 * they were shown (`version`, from their page). A copy of what they approved is kept with the approval.
 */
export async function approveEstimate(token: string, name: string, version: string): Promise<string> {
  const e = await estimateByToken(token);
  if (!e) return "This link isn't valid anymore.";
  if (e.status === "Approved") return "Already approved — thank you!";
  const who = clean(name, 120);
  if (who.length < 3) return "Please type your full name.";
  if (version !== estimateVersion(e)) return UPDATED; // it was changed while they were reading it
  if (((await schemaVersion()) ?? 0) < 11) await migrate();
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]!.trim() || null;
  const done = await sql().begin(async (tx) => {
    await LOCKS(tx);
    // Re-read with the row locked: an edit saved a moment ago must not slip in between the check and the approval.
    const [cur] = await tx`select * from estimates where id = ${e.id} for update`;
    if (!cur || cur.status === "Approved" || estimateVersion(estimateFromRow(cur)) !== version) return false;
    await tx`update estimates set status = 'Approved', approved_at = now(), approved_name = ${who},
             approved_version = ${version}, approved_snapshot = ${tx.json(JSON.parse(JSON.stringify(estimateContent(e))))},
             approved_ip = ${ip}, approved_ua = ${clean(h.get("user-agent"), 400)}
             where id = ${e.id} and status <> 'Approved'`;
    if (e.leadId) await tx`insert into lead_activity (lead_id, by_user, kind, text) values (${e.leadId}, 'u-owner', 'estimate', ${`✅ ${who} approved estimate #${e.number} — ${money(e.total)}`})`;
    return true;
  });
  if (!done) return (await estimateByToken(token))?.status === "Approved" ? "Already approved — thank you!" : UPDATED;
  after(() => customerApproved(e, who).catch((err) => console.error("approve notice failed", err)));
  revalidatePath(`/e/${token}`);
  revalidatePath("/", "layout");
  return "Done";
}

/** A photo for one estimate item (shrunk on the phone first). The customer sees it under that item. */
export async function uploadEstimatePhoto(form: FormData): Promise<{ id: string } | { error: string }> {
  if ((await currentUser()).role === "pm") return { error: "Not allowed" };
  if (!r2Ready()) return { error: "File storage isn't connected yet (Settings)." };
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { error: "No photo." };
  if (file.size > 4 * 1024 * 1024) return { error: "The photo is too big (max 4 MB)." };
  const ok = await checkUpload(file, ["image"]);
  if (!ok.ok) return { error: ok.error };
  const id = `P-${randomUUID().replace(/-/g, "").slice(0, 16)}.jpg`;
  const path = await putR2("estimates", id, new Uint8Array(await file.arrayBuffer()), ok.mime);
  return path ? { id } : { error: "Couldn't save the photo — try again." };
}

/** A copy of this estimate as a new draft (same customer and work). Returns where to go next: editing the copy. */
export async function duplicateEstimate(id: string): Promise<string> {
  const e = await estimateById(id);
  if (!e) throw new Error("Estimate not found.");
  const u = await canEdit(e.leadId);
  const copy = `E-${randomUUID().slice(0, 8)}`;
  await sql()`insert into estimates ${sql()({
    id: copy, token: newToken(), created_by: u.id, lead_id: e.leadId,
    customer: sql().json(e.customer), title: e.title, note: e.note, sections: sql().json(e.jobs),
    exclusions: sql().json(e.exclusions), schedule: sql().json(e.schedule), total: e.total, valid_days: e.validDays,
  })}`;
  return `/estimates/${copy}/edit`; // the button opens it with a full page load (see saveEstimate)
}

/** Only a draft that never went out can be deleted (anything the customer could have seen stays on record). */
export async function deleteDraftEstimate(id: string): Promise<string> {
  const e = await estimateById(id);
  if (!e) throw new Error("Estimate not found.");
  await canEdit(e.leadId);
  if (e.status !== "Draft" || e.sentAt) throw new Error("Only a draft that was never sent can be deleted.");
  await sql()`delete from estimates where id = ${id} and status = 'Draft' and sent_at is null`;
  return e.leadId ? `/leads/${e.leadId}` : "/estimates"; // the button opens it with a full page load (see saveEstimate)
}
