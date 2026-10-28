"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { canSeeProjectMoney, currentUser, getProject } from "@/lib/data";
import { migrate, schemaVersion, sql } from "@/lib/db";
import { putR2, r2Ready } from "@/lib/storage";
import { checkUpload } from "@/lib/upload-rules";

const MAX = 4 * 1024 * 1024; // what one upload from the phone can carry (photos are shrunk on the phone first)
const safe = (s: string) => s.replace(/[^\w.-]+/g, "_").slice(-80);

async function ready(projectId: string) {
  if (!r2Ready()) return { error: "File storage isn't connected yet (Settings)." };
  const project = await getProject(projectId);
  if (!project) return { error: "Project not found." };
  if (((await schemaVersion()) ?? 0) < 5) await migrate(); // creates the files table the first time
  return { project, user: await currentUser() };
}

async function save(projectId: string, file: File, kind: string, mime: string, extra: { phase?: string | null; expenseId?: string | null; by: string }) {
  const id = `F-${randomUUID().slice(0, 12)}`;
  const path = await putR2("projects", `${projectId}/${id}-${safe(file.name || kind)}`, new Uint8Array(await file.arrayBuffer()), mime);
  if (!path) return null;
  await sql()`insert into project_files ${sql()({ id, project_id: projectId, kind, phase: extra.phase ?? null, name: file.name || kind, path, mime, size: file.size, expense_id: extra.expenseId ?? null, added_by: extra.by })}`;
  return id;
}

/** One photo, video or document from the phone → R2 → the project. */
export async function uploadProjectFile(form: FormData): Promise<string> {
  const projectId = String(form.get("projectId") ?? "");
  const file = form.get("file");
  const r = await ready(projectId);
  if ("error" in r) return `Failed: ${r.error}`;
  if (!(file instanceof File) || !file.size) return "Failed: no file.";
  if (file.size > MAX) return `Failed: ${file.name} is too big (max 4 MB for now).`;
  const asDocument = !!form.get("asDocument");
  const ok = await checkUpload(file, asDocument ? ["pdf", "image", "office"] : ["image", "video", "pdf", "office"]);
  if (!ok.ok) return `Failed: ${ok.error}`;
  const kind = asDocument || ok.kind === "pdf" || ok.kind === "office" ? "document" : ok.kind === "image" ? "photo" : "video";
  const phase = kind === "document" ? null : ["Before", "During", "After"].includes(String(form.get("phase"))) ? String(form.get("phase")) : "During";
  const id = await save(projectId, file, kind, ok.mime, { phase, by: r.user.id });
  if (!id) return "Failed: couldn't save the file — try again.";
  revalidatePath(`/projects/${projectId}`);
  return "Done ✓";
}

/** "Snap receipt": a new expense (vendor, amount) with the receipt photo. */
export async function addExpense(form: FormData): Promise<string> {
  const projectId = String(form.get("projectId") ?? "");
  const r = await ready(projectId);
  if ("error" in r) return `Failed: ${r.error}`;
  if (!canSeeProjectMoney(r.user)) return "Failed: no access.";
  const vendor = String(form.get("vendor") ?? "").trim();
  const amount = Number(String(form.get("amount") ?? "").replace(/[^0-9.]/g, ""));
  if (!vendor || !(amount > 0)) return "Failed: enter who was paid and how much.";
  const category = String(form.get("category")) === "Materials" ? "Materials" : "Other";
  const contractN = Math.max(1, Number(form.get("contract")) || 1);
  const file = form.get("file");
  if (file instanceof File && file.size > MAX) return "Failed: the photo is too big (max 4 MB).";
  const receipt = file instanceof File && file.size ? await checkUpload(file, ["image", "pdf"]) : null;
  if (receipt && !receipt.ok) return `Failed: ${receipt.error}`;
  const expenseId = `${projectId}-x${randomUUID().slice(0, 8)}`;
  await sql()`insert into project_expenses ${sql()({ id: expenseId, project_id: projectId, contract_n: contractN === 1 ? null : contractN, vendor, amount, spent_at: new Date(), pending: false, category, source: "app", by_user: r.user.id })}`;
  if (file instanceof File && receipt?.ok) {
    if (!(await save(projectId, file, "receipt", receipt.mime, { expenseId, by: r.user.id }))) return "Saved the expense, but the photo didn't upload — try again from the expense.";
  }
  revalidatePath(`/projects/${projectId}`);
  return "Done ✓";
}
