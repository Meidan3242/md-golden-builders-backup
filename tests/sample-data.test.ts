import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/logins", () => ({ validAfter: vi.fn(async () => 0), isRevoked: vi.fn(async () => false) }));

const load = async () => { vi.resetModules(); return import("@/lib/data"); };
afterEach(() => vi.unstubAllEnvs());

describe("fictional sample data never appears next to real data", () => {
  it("with the real database: no sample subcontractors, marketing numbers or sample sales rep", async () => {
    vi.stubEnv("POSTGRES_URL", "postgres://test@localhost/test");
    const d = await load();
    expect(await d.getSubcontractors()).toEqual([]);
    expect(await d.getMarketingSpend()).toEqual([]);
    expect(d.subById("s1")).toBeUndefined();
    expect(d.assignableUsers().map((u) => u.id)).toEqual(["u-owner"]); // "Demo Sales Rep" can't log in
  });
  it("without a database (the demo), the samples are still there", async () => {
    vi.stubEnv("POSTGRES_URL", "");
    vi.stubEnv("DATABASE_URL", "");
    const d = await load();
    expect((await d.getSubcontractors()).length).toBeGreaterThan(0);
    expect(d.assignableUsers().map((u) => u.id)).toContain("u-rep");
  });
});
