import { describe, expect, it } from "vitest";
import { contractVersion, estimateVersion, stableStringify } from "@/lib/doc-version";

const est = {
  number: 601, customer: { name: "Test Customer", email: "t@example.com", phone: "1", address: "1 Test St" }, title: "Pavers", note: "Hi",
  jobs: [{ title: "Pavers", price: 18500, steps: [{ title: "Base", items: ["Road base"], photos: [] }] }], exclusions: ["Permits"],
  schedule: [{ name: "Start", pct: 100 }], total: 18500, validDays: 30,
};

describe("document versions: the customer can only approve / sign what they saw", () => {
  it("the same content gives the same version, whatever the key order (the database may reorder keys)", () => {
    const reordered = JSON.parse(JSON.stringify({ ...est, customer: { address: "1 Test St", phone: "1", email: "t@example.com", name: "Test Customer" } }));
    expect(estimateVersion(reordered)).toBe(estimateVersion(est));
    expect(stableStringify({ b: 1, a: [2, { d: 3, c: 4 }] })).toBe(stableStringify({ a: [2, { c: 4, d: 3 }], b: 1 }));
  });

  it("any change the customer could read changes the version", () => {
    const v = estimateVersion(est);
    expect(estimateVersion({ ...est, total: 19000 })).not.toBe(v);
    expect(estimateVersion({ ...est, jobs: [{ ...est.jobs[0]!, price: 19000 }] })).not.toBe(v);
    expect(estimateVersion({ ...est, jobs: [{ ...est.jobs[0]!, steps: [{ title: "Base", items: ["Road base", "Sand"], photos: [] }] }] })).not.toBe(v);
    expect(estimateVersion({ ...est, schedule: [{ name: "Start", pct: 50 }, { name: "End", pct: 50 }] })).not.toBe(v);
    expect(estimateVersion({ ...est, note: "Hello" })).not.toBe(v);
  });

  it("a contract's version changes with its details or a new contractor signature", () => {
    const data = { title: "Pavers", price: 18500, startDate: "Nov 1" };
    const sign = { name: "Meidan D.", at: "2026-10-26T00:00:00.000Z" };
    const v = contractVersion(data, sign);
    expect(contractVersion({ ...data }, { ...sign })).toBe(v);
    expect(contractVersion({ ...data, startDate: "Nov 2" }, sign)).not.toBe(v);
    expect(contractVersion(data, { ...sign, at: "2026-10-27T00:00:00.000Z" })).not.toBe(v);
  });
});
