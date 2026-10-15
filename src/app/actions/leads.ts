"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser, loggedInUser } from "@/lib/data";
import { dbReady, migrate, sql } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import { sanDiegoToUtc } from "@/lib/time";

const FILES_COPY_OFF = true;
const DEMO = "Demo mode — this saves for real once the database is connected.";

async function staff() {
  const u = await currentUser();
  if (u.role === "pm") throw new Error("Not allowed");
  return u;
}

const FOLLOW_UP_PLAN = [
  { step: "Day 1", days: 1, action: "Call + text: did you get the estimate? Offer a second meeting", who: "u-office" },
  { step: "Day 3", days: 3, action: "Call + text: answer questions, book second meeting", who: "u-office" },
  { step: "Day 7", days: 7, action: "Text check-in (Laline)", who: "u-office" },
  { step: "Day 14", days: 14, action: "Your message: crew available — Meidan sends from his phone", who: "u-owner" },
  { step: "Day 30", days: 30, action: "Last friendly check-in (Laline)", who: "u-office" },
];

export async function createLead(_: string | null, form: FormData): Promise<string | null> {
  const u = await staff();
  if (!(await dbReady())) return DEMO;
  const f = (k: string) => String(form.get(k) ?? "").trim();
  if (!f("name") || !f("phone")) return "Name and phone are required.";
  const address = f("address");
  const city = address.split(",")[1]?.trim() ?? "";
  const createdAt = f("cameIn") ? sanDiegoToUtc(f("cameIn")) : new Date();
  const visitDay = f("visitDay");
  const visitHour = f("visitHour");
  const visitType = f("visitType") || "Site visit";
  const db = sql();
  const id = await db.begin(async (tx) => {
    await tx`set local lock_timeout = '8s'`; await tx`set local statement_timeout = '50s'`; await tx`set local idle_in_transaction_session_timeout = '60s'`; // never leave the database locked
    const [lead] = await tx`
      insert into leads (name, phone, email, address, city, service, source, assigned_to, notes, created_at, stage)
      values (${f("name")}, ${f("phone")}, ${f("email") || null}, ${address}, ${city}, ${f("service") || "Other"}, ${f("source") || "Other"},
              ${f("assignTo") || u.id}, ${f("notes") || null}, ${createdAt}, ${visitDay ? (visitType === "Second meeting" ? "Second Meeting" : "Appointment Set") : "New"})
      returning id`;
    await tx`insert into lead_activity (lead_id, by_user, kind, text) values (${lead.id}, ${u.id}, 'note', ${`Lead created by ${u.name}`})`;
    if (visitDay && visitHour) {
      const start = sanDiegoToUtc(`${visitDay}T${visitHour.padStart(2, "0")}:00`);
      const type = visitType === "Second meeting" ? "Second Meeting" : visitType === "Phone call" ? "Project Meeting" : "Site Visit";
      await tx`insert into appointments (lead_id, title, type, start_at, assigned_to) values (${lead.id}, ${`${visitType} — ${f("name")}`}, ${type}, ${start}, ${f("assignTo") || "u-owner"})`;
      await tx`update leads set closed_at = now() where id = ${lead.id}`;
    }
    return lead.id as string;
  });
  revalidatePath("/", "layout");
  redirect(`/leads/${id}`);
}

/** ✓ in the weekly list: closed (meeting booked or done). */
export async function closeLead(id: string) {
  const u = await staff();
  if (!(await dbReady())) return;
  await sql()`update leads set closed_at = now(), updated_at = now() where id = ${id}`;
  await sql()`insert into lead_activity (lead_id, by_user, kind, text) values (${id}, ${u.id}, 'stage', 'Closed ✓')`;
  revalidatePath("/", "layout");
}

export async function reopenLead(id: string) {
  await staff();
  if (!(await dbReady())) return;
  await sql()`update leads set closed_at = null, updated_at = now() where id = ${id}`;
  revalidatePath("/", "layout");
}

/** Price + Joist PDF → "Estimate sent", and the follow-up plan starts. */
export async function markEstimateSent(_: string | null, form: FormData): Promise<string | null> {
  const u = await staff();
  if (!(await dbReady())) return DEMO;
  const id = String(form.get("id"));
  const amount = Number(String(form.get("amount") ?? "").replace(/[^0-9.]/g, ""));
  if (!amount) return "Type the estimate amount.";
  const file = form.get("pdf");
  let pdf: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > 20 * 1024 * 1024) return "PDF is too big (max 20 MB).";
    pdf = await uploadFile("estimates", `${id}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`, file);
  }
  const sentAt = new Date();
  await sql().begin(async (tx) => {
    await tx`set local lock_timeout = '8s'`; await tx`set local statement_timeout = '50s'`; await tx`set local idle_in_transaction_session_timeout = '60s'`; // never leave the database locked
    await tx`update leads set stage = 'Estimate Sent', estimate_amount = ${amount}, estimate_sent_at = ${sentAt},
             estimate_pdf = coalesce(${pdf}, estimate_pdf), closed_at = null, updated_at = now() where id = ${id}`;
    await tx`insert into lead_activity (lead_id, by_user, kind, text) values (${id}, ${u.id}, 'estimate', ${`Estimate sent — $${amount.toLocaleString()}`})`;
    for (const s of FOLLOW_UP_PLAN) {
      await tx`insert into follow_ups (lead_id, step, due, action, assigned_to)
               values (${id}, ${s.step}, ${new Date(sentAt.getTime() + s.days * 86_400_000)}, ${s.action}, ${s.who})`;
    }
  });
  revalidatePath("/", "layout");
  return null;
}

export async function finishFollowUp(id: string) {
  await staff();
  if (!(await dbReady())) return;
  await sql()`update follow_ups set done = true where id = ${Number(id)}`;
  revalidatePath("/", "layout");
}

/** Settings → "Set up database" (owner only). Safe to press twice. */
export async function setupDatabase(): Promise<string> {
  const me = await loggedInUser();
  if (me?.role !== "admin") return "Only the owner can do this.";
  try {
    const applied = await migrate();
    revalidatePath("/", "layout");
    return applied.length ? `Done ✓ ${applied.join(" · ")}` : "Already up to date ✓";
  } catch (e) {
    return `Failed: ${(e as Error).message}`;
  }
}

/** Settings → "Import from monday" (owner only). Reads monday on the server with MONDAY_API_TOKEN. */
export async function importFromMonday(boardId: string): Promise<string> {
  const me = await loggedInUser();
  if (me?.role !== "admin") return "Only the owner can do this.";
  if (!(await dbReady())) return "Set up the database first.";
  try {
    await migrate(); // makes sure the import columns exist
    const { importBoard } = await import("@/lib/monday-import");
    const msg = await importBoard(boardId);
    revalidatePath("/", "layout");
    return `Done ✓ ${msg}`;
  } catch (e) {
    return `Failed: ${(e as Error).message}`;
  }
}

/** Settings → "Import clients" (owner only): Clients 2026 + 2025 and every client's own board. */
export type ImportStep = { msg: string; next?: number | null };

/** One round of the clients import; the button calls again with `next` until it is null. */
export async function importClientsFromMonday(start = 0): Promise<ImportStep> {
  const me = await loggedInUser();
  if (me?.role !== "admin") return { msg: "Only the owner can do this." };
  if (!(await dbReady())) return { msg: "Set up the database first." };
  try {
    if (start === 0) await migrate(); // creates the projects tables the first time
    const { importClients } = await import("@/lib/monday-clients");
    const r = await importClients(start, Number(process.env.IMPORT_BUDGET_MS) || 30_000);
    if (r.next === null) revalidatePath("/", "layout");
    return r.next === null ? { msg: `Done ✓ ${r.msg}`, next: null } : { msg: `Importing… ${r.msg}`, next: r.next };
  } catch (e) {
    return { msg: `Failed: ${(e as Error).message}` };
  }
}

/** One round of copying files (~40s); the button calls again while `next` is set. */
export async function importFilesFromMonday(): Promise<ImportStep> {
  // Turned off (owner's decision, 2026-10-15): no customer files leave monday until per-person login exists.
  if (FILES_COPY_OFF) return { msg: "Failed: copying files from monday is turned off for now." };
  const me = await loggedInUser();
  if (me?.role !== "admin") return { msg: "Only the owner can do this." };
  if (!(await dbReady())) return { msg: "Set up the database first." };
  const { r2Ready } = await import("@/lib/storage");
  if (!r2Ready()) return { msg: "Failed: connect Cloudflare storage first." };
  try {
    await migrate(); // creates the files table the first time
    const { importMondayFiles } = await import("@/lib/monday-files");
    const r = await importMondayFiles(30_000);
    if (!r.more) revalidatePath("/", "layout");
    return { msg: r.msg, next: r.more ? 1 : null };
  } catch (e) {
    return { msg: `Failed: ${(e as Error).message}` };
  }
}
