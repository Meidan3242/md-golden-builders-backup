import { beforeEach, describe, expect, it, vi } from "vitest";
import { loginAs, SECRET } from "./helpers";

vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.9" })) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((to: string) => { throw new Error(`REDIRECT ${to}`); }) }));
vi.mock("@/lib/logins", () => ({ validAfter: vi.fn(async () => 0), isRevoked: vi.fn(async () => false), cutSessions: vi.fn(), revokeSession: vi.fn() }));
vi.mock("@/lib/login-guard", () => ({ loginBlocked: vi.fn(async () => false), recordLogin: vi.fn() }));
vi.mock("@/lib/accounts", () => ({
  ACCOUNTS: { "owner@example.com": "u-owner" }, userOfEmail: (e: string) => (e === "owner@example.com" ? "u-owner" : undefined),
  emailOf: vi.fn(), authReady: () => true, MIN_PASSWORD: 10,
  checkPassword: vi.fn(async (_e: string, p: string) => p === "right-password-123"), findAccount: vi.fn(async () => ({ id: "x" })), setAccountPassword: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ migrate: vi.fn(), sql: vi.fn(), schemaVersion: async () => 11, dbReady: async () => true }));
vi.mock("@/lib/lead-repo", () => ({ dbLeads: async () => [], dbAppointments: async () => [], dbFollowUps: async () => [] }));
vi.mock("@/lib/project-repo", () => ({ dbProjects: async () => [] }));
process.env.AUTH_SECRET = SECRET;

const { login, logout } = await import("@/app/actions/auth");
const guard = await import("@/lib/login-guard");
const logins = await import("@/lib/logins");
const { readSession } = await import("@/lib/session");

const form = (email: string, password: string) => { const f = new FormData(); f.set("email", email); f.set("password", password); return f; };
beforeEach(() => vi.clearAllMocks());

describe("login protection", () => {
  it("after too many wrong tries the login waits — even with the right password", async () => {
    await loginAs(null);
    vi.mocked(guard.loginBlocked).mockResolvedValueOnce(true);
    expect(await login(null, form("owner@example.com", "right-password-123"))).toMatch(/Too many tries/);
  }, 10_000);

  it("wrong passwords are counted; a good login clears the count", async () => {
    await loginAs(null);
    expect(await login(null, form("owner@example.com", "wrong-password"))).toBe("Wrong email or password.");
    expect(guard.recordLogin).toHaveBeenCalledWith("owner@example.com", "203.0.113.9", false);
    await expect(login(null, form("owner@example.com", "right-password-123"))).rejects.toThrow("REDIRECT /");
    expect(guard.recordLogin).toHaveBeenCalledWith("owner@example.com", "203.0.113.9", true);
  }, 10_000);

  it("unknown emails are counted too (no free guessing of who has an account)", async () => {
    await loginAs(null);
    await login(null, form("someone@example.com", "x"));
    expect(guard.recordLogin).toHaveBeenCalledWith("someone@example.com", "203.0.113.9", false);
  }, 10_000);
});

describe("log out", () => {
  it("ends this session on the server, not only in the browser", async () => {
    const token = await loginAs("u-owner");
    const s = await readSession(token, SECRET);
    await expect(logout()).rejects.toThrow("REDIRECT /login");
    expect(logins.revokeSession).toHaveBeenCalledWith(s!.sid, "u-owner", s!.exp);
  });
});
