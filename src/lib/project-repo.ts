import "server-only";
import { cache } from "react";
import { schemaVersion, sql } from "./db";
import type { ChangeOrder, Expense, MediaItem, PaymentMilestone, Project, ProjectDoc, ProjectStage } from "./types";

const iso = (d: unknown) => (d ? new Date(d as string).toISOString() : undefined);
const num = (x: unknown) => (x == null ? 0 : Number(x));

/** Real projects (imported from monday or created in the app), shaped like the rest of the app expects. */
export const dbProjects = cache(async (): Promise<Project[]> => {
  const db = sql();
  const hasFiles = ((await schemaVersion()) ?? 0) >= 5;
  // One after another (each is a few ms): keeps the number of open database connections low.
  const ps = await db`select * from projects order by signed_at`;
  const cs = await db`select * from project_contracts order by n`;
  const pays = await db`select * from project_payments order by paid_at nulls last, id`;
  const exps = await db`select * from project_expenses order by spent_at nulls last, id`;
  const files = hasFiles ? await db`select id, project_id, kind, phase, name, mime, expense_id, created_at from project_files order by created_at` : [];
  const group = <T extends { project_id: string }>(xs: readonly T[]) => xs.reduce<Record<string, T[]>>((a, x) => ((a[x.project_id] ??= []).push(x), a), {});
  const C = group(cs as unknown as { project_id: string; n: number; title: string; amount: string; signed_at: string; status: string; id: string }[]);
  const P = group(pays as unknown as { project_id: string; id: string; contract_n: number | null; name: string; amount: string; paid_at: string; method: string | null; status: string }[]);
  const E = group(exps as unknown as { project_id: string; id: string; contract_n: number | null; vendor: string; amount: string; spent_at: string; pending: boolean; category: string; source?: string; by_user?: string | null }[]);
  const F = group(files as unknown as { project_id: string; id: string; kind: string; phase: string | null; name: string; mime: string | null; expense_id: string | null; created_at: string }[]);
  const receiptOf = Object.fromEntries((files as unknown as { id: string; expense_id: string | null }[]).filter((f) => f.expense_id).map((f) => [f.expense_id!, `/files/${f.id}`]));
  const perYear: Record<string, number> = {};

  return ps.map((p) => {
    const year = new Date(p.signed_at).getUTCFullYear();
    perYear[year] = (perYear[year] ?? 0) + 1;
    const pay = (n: number | null): PaymentMilestone[] =>
      (P[p.id] ?? []).filter((x) => (x.contract_n ?? 1) === (n ?? 1)).map((x) => ({
        id: x.id, name: x.name, amount: num(x.amount), status: x.status as PaymentMilestone["status"], paidAt: x.status === "Paid" ? iso(x.paid_at) : undefined,
        dueDate: x.status !== "Paid" ? iso(x.paid_at) : undefined, method: (x.method ?? undefined) as PaymentMilestone["method"], receiptSent: false,
      }));
    const exp = (n: number | null): Expense[] =>
      (E[p.id] ?? []).filter((x) => (x.contract_n ?? 1) === (n ?? 1)).map((x) => ({
        id: x.id, date: iso(x.spent_at) ?? iso(p.signed_at)!, vendor: x.vendor, category: x.category as Expense["category"], amount: num(x.amount),
        // monday rows: the receipt lives in monday. App rows: only when a photo was snapped.
        receipt: x.source === "app" ? !!receiptOf[x.id] : true, receiptHref: receiptOf[x.id], by: x.by_user ?? "u-owner", pending: x.pending,
      }));
    const contracts = C[p.id] ?? [];
    const changeOrders: ChangeOrder[] = contracts.filter((c) => c.n > 1).map((c) => ({
      id: c.id, number: c.n - 1, title: c.title, amount: num(c.amount), status: c.status as ChangeOrder["status"], signedAt: iso(c.signed_at), milestones: pay(c.n), subs: [], expenses: exp(c.n),
    }));
    return {
      id: p.id,
      leadId: p.lead_id ?? "",
      number: `${year}-${String(perYear[year]).padStart(3, "0")}`,
      customer: p.customer,
      phone: p.phone,
      email: p.email ?? undefined,
      address: p.address,
      city: p.city,
      type: p.type,
      stage: p.stage as ProjectStage,
      assignedTo: "u-owner",
      contractValue: num(contracts.find((c) => c.n === 1)?.amount ?? p.sale),
      signedAt: iso(p.signed_at)!,
      milestones: pay(1),
      changeOrders,
      subs: [],
      expenses: exp(1),
      permits: [],
      media: (F[p.id] ?? []).filter((f) => f.kind === "photo" || f.kind === "video").map((f): MediaItem => ({
        id: f.id, phase: (f.phase ?? "From monday") as MediaItem["phase"], kind: f.kind as MediaItem["kind"], caption: f.name, at: iso(f.created_at)!, hue: 30, src: `/files/${f.id}`,
      })),
      documents: (F[p.id] ?? []).filter((f) => f.kind === "document" || (f.kind === "receipt" && !f.expense_id)).map((f): ProjectDoc => ({
        id: f.id, name: f.name, at: iso(f.created_at)!, href: `/files/${f.id}`,
        kind: /change\s*order/i.test(f.name) ? "Change Order" : /contract/i.test(f.name) ? "Contract" : /permit/i.test(f.name) ? "Permit" : /plan/i.test(f.name) ? "Plans" : /estimate/i.test(f.name) ? "Estimate" : /lien/i.test(f.name) ? "Lien Waiver" : "Other",
      })),
      activity: [],
      chat: [],
      stuck: p.stuck,
      origin: p.origin ?? undefined,
      sale: p.sale != null ? num(p.sale) : undefined,
      cost: p.cost != null ? num(p.cost) : undefined,
    } satisfies Project;
  }).reverse();
});
