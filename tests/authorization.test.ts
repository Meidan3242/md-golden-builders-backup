import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSql, loginAs, SECRET } from "./helpers";

vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn(async () => new Headers()) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((to: string) => { throw new Error(`REDIRECT ${to}`); }), notFound: vi.fn() }));
vi.mock("@/lib/logins", () => ({ validAfter: vi.fn(async () => 0), isRevoked: vi.fn(async () => false), cutSessions: vi.fn(), revokeSession: vi.fn() }));
const db = fakeSql((q) => (q.includes("from follow_ups") ? [{ lead_id: "L-other" }] : []));
vi.mock("@/lib/db", () => ({ sql: () => db.tag, dbReady: async () => true, schemaVersion: async () => 11, migrate: vi.fn() }));
vi.mock("@/lib/lead-repo", () => ({
  dbLeads: async () => [
    { id: "L-mine", assignedTo: "u-rep", name: "Mine" },
    { id: "L-other", assignedTo: "u-owner", name: "Other" },
  ],
  dbAppointments: async () => [],
  dbFollowUps: async () => [],
}));
vi.mock("@/lib/project-repo", () => ({ dbProjects: async () => [] }));

process.env.AUTH_SECRET = SECRET;
process.env.POSTGRES_URL = "postgres://test@localhost/test";

const { closeLead, reopenLead, finishFollowUp, markEstimateSent } = await import("@/app/actions/leads");
const { leadForChange, loggedInUser } = await import("@/lib/data");
const logins = await import("@/lib/logins");

beforeEach(() => { db.calls.length = 0; });
const writes = () => db.calls.filter((c) => /^\s*(update|insert|delete)/i.test(c.q));

describe("a sales rep can only change their own leads", () => {
  it("leadForChange gives the rep's own lead and refuses anyone else's", async () => {
    await loginAs("u-rep");
    expect((await leadForChange("L-mine")).lead.id).toBe("L-mine");
    await expect(leadForChange("L-other")).rejects.toThrow("Not allowed");
    await expect(leadForChange("L-does-not-exist")).rejects.toThrow("Not allowed");
  });

  it("close / reopen / estimate-sent on another rep's lead are refused before anything is written", async () => {
    await loginAs("u-rep");
    await expect(closeLead("L-other")).rejects.toThrow("Not allowed");
    await expect(reopenLead("L-other")).rejects.toThrow("Not allowed");
    const form = new FormData(); form.set("id", "L-other"); form.set("amount", "5000");
    await expect(markEstimateSent(null, form)).rejects.toThrow("Not allowed");
    expect(writes()).toHaveLength(0);
  });

  it("finishing a follow-up of someone else's lead is refused", async () => {
    await loginAs("u-rep");
    await expect(finishFollowUp("7")).rejects.toThrow("Not allowed");
    expect(writes()).toHaveLength(0);
  });

  it("the rep's own lead still works", async () => {
    await loginAs("u-rep");
    await closeLead("L-mine");
    expect(writes().length).toBeGreaterThan(0);
  });

  it("the owner can change any lead; a project manager none", async () => {
    await loginAs("u-owner");
    await expect(leadForChange("L-other")).resolves.toBeTruthy();
    await loginAs("u-pm");
    await expect(leadForChange("L-mine")).rejects.toThrow("Not allowed");
  });
});

describe("log out on one device ends that session on the server", () => {
  it("a revoked session id is no longer logged in", async () => {
    await loginAs("u-owner");
    expect((await loggedInUser())?.id).toBe("u-owner");
    vi.mocked(logins.isRevoked).mockResolvedValueOnce(true);
    expect(await loggedInUser()).toBeNull();
  });
});
