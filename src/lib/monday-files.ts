import "server-only";
import { sql } from "./db";
import { boardAssets, itemAssets, type MondayAsset } from "./monday";
import { putR2 } from "./storage";

const PHOTO = /^(jpe?g|png|heic|heif|webp|gif)$/i;
const VIDEO = /^(mov|mp4|m4v|avi|3gp)$/i;
const MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", heic: "image/heic", heif: "image/heif", webp: "image/webp", gif: "image/gif", mov: "video/quicktime", mp4: "video/mp4", m4v: "video/mp4", pdf: "application/pdf" };
const MAX = 150 * 1024 * 1024; // bigger videos stay in monday for now
const safe = (s: string) => s.replace(/[^\w.-]+/g, "_").slice(-80);

type Todo = { projectId: string; asset: MondayAsset; label: string; expenses: boolean };

/**
 * Copies files from monday (client rows + each client's own board) into R2, a batch at a time.
 * Every file is copied once (remembered by its monday id), so pressing again continues where it stopped.
 */
export async function importMondayFiles(budgetMs = 30_000): Promise<{ msg: string; more: boolean }> {
  const start = Date.now();
  const db = sql();
  const projects = await db`select id, monday_id, monday_board_id from projects where monday_id is not null or monday_board_id is not null`;
  const done = new Set((await db`select monday_asset_id from project_files where monday_asset_id is not null`).map((r) => r.monday_asset_id as string));

  const todo: Todo[] = [];
  const byItem = Object.fromEntries(projects.filter((p) => p.monday_id).map((p) => [p.monday_id as string, p.id as string]));
  for (const it of await itemAssets(Object.keys(byItem))) for (const a of it.assets ?? []) todo.push({ projectId: byItem[it.id], asset: a, label: a.name, expenses: false });
  const byBoard = Object.fromEntries(projects.filter((p) => p.monday_board_id).map((p) => [p.monday_board_id as string, p.id as string]));
  const boards = await boardAssets(Object.keys(byBoard));
  for (const [boardId, items] of Object.entries(boards))
    for (const it of items) for (const a of it.assets) todo.push({ projectId: byBoard[boardId], asset: a, label: `${it.name} — ${a.name}`, expenses: it.group === "expenses" });

  const unique = [...new Map(todo.map((t) => [t.asset.id, t])).values()];
  const left = unique.filter((t) => !done.has(t.asset.id));
  const tooBig = left.filter((t) => t.asset.file_size > MAX);
  const queue = left.filter((t) => t.asset.file_size <= MAX);
  let copied = 0;
  const failed: string[] = [];
  for (const t of queue) {
    if (Date.now() - start > budgetMs) break;
    const ext = (t.asset.file_extension || t.asset.name.split(".").pop() || "").replace(/^\./, "").toLowerCase();
    const kind = t.expenses ? "receipt" : PHOTO.test(ext) ? "photo" : VIDEO.test(ext) ? "video" : "document";
    try {
      const res = await fetch(t.asset.public_url, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) throw new Error(`${res.status}`);
      const body = new Uint8Array(await res.arrayBuffer());
      const id = `F-m${t.asset.id}`;
      const mime = MIME[ext] ?? res.headers.get("content-type") ?? "application/octet-stream";
      const path = await putR2("projects", `${t.projectId}/${id}-${safe(t.asset.name)}`, body, mime);
      if (!path) throw new Error("storage");
      await db`insert into project_files ${db({ id, project_id: t.projectId, kind, phase: kind === "photo" || kind === "video" ? "From monday" : null, name: t.label, path, mime, size: body.length, monday_asset_id: t.asset.id, added_by: "monday", created_at: new Date(t.asset.created_at) })}
               on conflict (monday_asset_id) do nothing`;
      copied++;
    } catch {
      failed.push(t.asset.name);
    }
  }
  const remaining = queue.length - copied - failed.length;
  const msg = [
    remaining > 0 ? `Copying… ${copied} copied this round · ${remaining} left` : `Done ✓ ${copied} copied this round · all files from monday are in`,
    failed.length ? `${failed.length} failed (press again to retry): ${failed.slice(0, 3).join(", ")}${failed.length > 3 ? "…" : ""}` : "",
    tooBig.length ? `${tooBig.length} video${tooBig.length === 1 ? "" : "s"} over 150 MB stay${tooBig.length === 1 ? "s" : ""} in monday for now` : "",
  ].filter(Boolean).join(" · ");
  return { msg, more: remaining > 0 && copied > 0 };
}
