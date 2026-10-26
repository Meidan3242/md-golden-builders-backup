import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { ContractData, ContractorSign, OwnerSign } from "./contract-form";
import { schemaVersion, sql } from "./db";

export type Contract = {
  id: string;
  number: number;
  estimateId: string | null;
  leadId: string | null;
  token: string;
  data: ContractData;
  status: "Draft" | "Sent" | "Viewed" | "Signed";
  contractor?: ContractorSign;
  owner?: OwnerSign;
  docHash?: string;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  signedAt?: string;
};

export const contractsReady = async () => ((await schemaVersion()) ?? 0) >= 10;
export const newContractToken = () => randomBytes(24).toString("base64url");

const iso = (d: unknown) => (d ? new Date(d as string).toISOString() : undefined);
function row(r: Record<string, unknown>): Contract {
  return {
    id: r.id as string,
    number: r.number as number,
    estimateId: (r.estimate_id as string) ?? null,
    leadId: (r.lead_id as string) ?? null,
    token: r.token as string,
    data: r.data as ContractData,
    status: r.status as Contract["status"],
    contractor: (r.contractor_sign as ContractorSign) ?? undefined,
    owner: (r.owner_sign as OwnerSign) ?? undefined,
    docHash: (r.doc_hash as string) ?? undefined,
    createdAt: iso(r.created_at)!,
    sentAt: iso(r.sent_at),
    viewedAt: iso(r.viewed_at),
    signedAt: iso(r.signed_at),
  };
}

/** Staff side — callers must already have checked the person can see the lead. */
export async function contractById(id: string) {
  if (!(await contractsReady())) return null;
  const [r] = await sql()`select * from contracts where id = ${id}`;
  return r ? row(r) : null;
}
export async function contractOfEstimate(estimateId: string) {
  if (!(await contractsReady())) return null;
  const [r] = await sql()`select * from contracts where estimate_id = ${estimateId} order by created_at desc limit 1`;
  return r ? row(r) : null;
}
/** Customer side — only by the private link, and only once Meidan signed and sent it. */
export async function contractByToken(token: string) {
  if (!/^[\w-]{20,}$/.test(token) || !(await contractsReady())) return null;
  const [r] = await sql()`select * from contracts where token = ${token} and status <> 'Draft'`;
  return r ? row(r) : null;
}

/** Fingerprint of exactly what was signed (any later change to the text would not match). */
export const docHash = (data: ContractData, contractor?: ContractorSign, owner?: OwnerSign) =>
  createHash("sha256").update(JSON.stringify({ data, contractor: contractor ?? null, owner: owner ?? null })).digest("hex");

/** How customers pay (Zelle / check / …) — written once by the team, sent with every contract. Never on a public page. */
export async function payInstructions(): Promise<string> {
  const [r] = await sql()`select value from app_settings where key = 'pay_instructions'`;
  return typeof r?.value === "string" ? r.value : "";
}
