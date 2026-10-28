import { createHash } from "node:crypto";

// A fingerprint of exactly what the customer is looking at. The page sends it back with "Approve" / "Sign";
// if the document changed in between, the customer is asked to review the new version first.

/** JSON with keys in a fixed order — the database may return object keys in any order. */
export function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

const hash = (v: unknown) => createHash("sha256").update(stableStringify(v)).digest("hex").slice(0, 32);

/** What the customer approves on an estimate: everything they can read on it. */
export type EstimateContent = {
  number: number;
  customer: unknown;
  title: string;
  note: string;
  jobs: unknown;
  exclusions: string[];
  schedule: unknown;
  total: number;
  validDays: number;
};
export const estimateContent = (e: EstimateContent): EstimateContent => ({
  number: e.number, customer: e.customer, title: e.title, note: e.note, jobs: e.jobs, exclusions: e.exclusions, schedule: e.schedule, total: Number(e.total), validDays: e.validDays,
});
export const estimateVersion = (e: EstimateContent) => hash(estimateContent(e));

/** What the customer signs on a contract: the filled-in contract and Meidan's signature on it. */
export const contractVersion = (data: unknown, contractor: unknown) => hash({ data, contractor: contractor ?? null });

/** The message the customer pages show when the document changed while they were reading it. */
export const UPDATED = "UPDATED";
