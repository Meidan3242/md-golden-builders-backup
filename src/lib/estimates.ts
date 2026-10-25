import "server-only";
import { randomBytes } from "node:crypto";
import { schemaVersion, sql } from "./db";
import type { EstimateSection, EstimateStage } from "./estimate-templates";

export type EstimateCustomer = { name: string; email: string; phone: string; address: string };
export type Estimate = {
  id: string;
  number: number;
  leadId: string | null;
  token: string;
  customer: EstimateCustomer;
  title: string;
  note: string;
  sections: EstimateSection[];
  exclusions: string[];
  schedule: EstimateStage[];
  total: number;
  validDays: number;
  status: "Draft" | "Sent" | "Viewed" | "Approved";
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  approvedAt?: string;
  approvedName?: string;
  openCount: number; // times the customer opened it (not counting the team)
  lastOpenedAt?: string;
};

export const estimatesReady = async () => ((await schemaVersion()) ?? 0) >= 8;
export const newToken = () => randomBytes(24).toString("base64url"); // the customer's private link — unguessable

const iso = (d: unknown) => (d ? new Date(d as string).toISOString() : undefined);
function row(r: Record<string, unknown>): Estimate {
  return {
    id: r.id as string,
    number: r.number as number,
    leadId: (r.lead_id as string) ?? null,
    token: r.token as string,
    customer: r.customer as EstimateCustomer,
    title: r.title as string,
    note: r.note as string,
    sections: r.sections as EstimateSection[],
    exclusions: r.exclusions as string[],
    schedule: r.schedule as EstimateStage[],
    total: Number(r.total),
    validDays: r.valid_days as number,
    status: r.status as Estimate["status"],
    createdAt: iso(r.created_at)!,
    sentAt: iso(r.sent_at),
    viewedAt: iso(r.viewed_at),
    approvedAt: iso(r.approved_at),
    approvedName: (r.approved_name as string) ?? undefined,
    openCount: Number(r.open_count ?? 0),
    lastOpenedAt: iso(r.last_opened_at),
  };
}

/** Staff side — callers must already have checked the person can see the lead. */
export async function estimateById(id: string) {
  if (!(await estimatesReady())) return null;
  const [r] = await sql()`select * from estimates where id = ${id}`;
  return r ? row(r) : null;
}
export async function estimatesOfLead(leadId: string) {
  if (!(await estimatesReady())) return [];
  return (await sql()`select * from estimates where lead_id = ${leadId} order by created_at desc`).map(row);
}
/** Customer side — only by the private link. Drafts are never shown. */
export async function estimateByToken(token: string) {
  if (!/^[\w-]{20,}$/.test(token) || !(await estimatesReady())) return null;
  const [r] = await sql()`select * from estimates where token = ${token} and status <> 'Draft'`;
  return r ? row(r) : null;
}

/** A photo attached to an estimate item: "P-" + 16 hex + ".jpg", saved in R2 under estimates/. */
export const PHOTO_ID = /^P-[0-9a-f]{16}\.jpg$/;
