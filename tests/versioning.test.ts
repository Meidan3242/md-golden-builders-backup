import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSql } from "./helpers";

vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn(async () => new Headers({ "x-forwarded-for": "198.51.100.7", "user-agent": "Test" })) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn() }));

const est = {
  id: "E-1", number: 601, leadId: null, token: "t".repeat(32), customer: { name: "Test Customer", email: "", phone: "", address: "1 Test St" }, title: "Pavers", note: "Hi",
  jobs: [{ title: "Pavers", price: 18500, steps: [{ title: "Base", items: ["Road base"], photos: [] }] }], exclusions: [], schedule: [{ name: "Start", pct: 100 }],
  total: 18500, validDays: 30, status: "Sent", createdAt: "2026-10-01T00:00:00.000Z", openCount: 1,
};
let current = est; // what the database holds right now
vi.mock("@/lib/estimates", async (orig) => ({
  ...(await orig<typeof import("@/lib/estimates")>()),
  estimateByToken: vi.fn(async () => current),
  estimateFromRow: vi.fn(() => current),
}));
const db = fakeSql((q) => (q.includes("for update") ? [{ status: current.status }] : []));
vi.mock("@/lib/db", () => ({ sql: () => db.tag, schemaVersion: async () => 11, migrate: vi.fn(), dbReady: async () => true }));

const contract = {
  id: "C-1", number: 100, estimateId: "E-1", leadId: null, token: "c".repeat(32), status: "Sent",
  data: { owner: { name: "Test Customer" }, title: "Pavers", price: 18500, age65: false, arbitration: false },
  contractor: { name: "Meidan D.", initials: "MD", at: "2026-10-26T00:00:00.000Z", ip: "1" }, createdAt: "2026-10-26T00:00:00.000Z",
};
let currentContract = contract;
vi.mock("@/lib/contracts", async (orig) => ({ ...(await orig<typeof import("@/lib/contracts")>()), contractByToken: vi.fn(async () => currentContract) }));

const { approveEstimate } = await import("@/app/actions/estimates");
const { signContract } = await import("@/app/actions/contracts");
const { contractVersion, estimateVersion } = await import("@/lib/doc-version");
const writes = () => db.calls.filter((c) => /^\s*(update|insert)/i.test(c.q));
beforeEach(() => { db.calls.length = 0; current = est; currentContract = contract; });

describe("estimate approval is pinned to the version the customer saw", () => {
  it("approving the version on screen works and keeps a copy of it", async () => {
    expect(await approveEstimate(est.token, "Test Customer", estimateVersion(est))).toBe("Done");
    const upd = writes().find((c) => c.q.includes("update estimates"))!;
    expect(upd.q).toContain("approved_snapshot");
    expect(upd.values).toContain(estimateVersion(est));
  });

  it("if the estimate changed while they were reading, nothing is approved", async () => {
    const seen = estimateVersion(est);
    current = { ...est, total: 21000, jobs: [{ ...est.jobs[0]!, price: 21000 }] };
    expect(await approveEstimate(est.token, "Test Customer", seen)).toBe("UPDATED");
    expect(writes()).toHaveLength(0);
  });

  it("a change saved between the check and the approval is caught inside the transaction", async () => {
    const seen = estimateVersion(est);
    db.calls.length = 0;
    const real = db.tag.begin as (fn: (tx: unknown) => unknown) => Promise<unknown>;
    (db.tag as Record<string, unknown>).begin = async (fn: (tx: unknown) => unknown) => { current = { ...est, note: "Changed" }; return real(fn); };
    expect(await approveEstimate(est.token, "Test Customer", seen)).toBe("UPDATED");
    expect(writes().filter((c) => c.q.includes("update estimates"))).toHaveLength(0);
    (db.tag as Record<string, unknown>).begin = real;
  });
});

describe("contract signing is pinned to the version the customer saw", () => {
  it("an old version can't be signed", async () => {
    const seen = contractVersion(contract.data, contract.contractor);
    currentContract = { ...contract, data: { ...contract.data, price: 25000 } };
    expect(await signContract(contract.token, { name: "Test Customer", version: seen })).toBe("UPDATED");
    expect(writes()).toHaveLength(0);
  });
  it("re-signed by Meidan after a change → the old page can't sign either", async () => {
    const seen = contractVersion(contract.data, contract.contractor);
    currentContract = { ...contract, contractor: { ...contract.contractor, at: "2026-10-27T00:00:00.000Z" } };
    expect(await signContract(contract.token, { name: "Test Customer", version: seen })).toBe("UPDATED");
  });
});
