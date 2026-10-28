import { afterEach, describe, expect, it, vi } from "vitest";

// A Vercel Preview must never reach production — even if a production variable is also visible to Preview.
const PROD = {
  POSTGRES_URL: "postgres://prod-user:prod-pass@prod-db.example.com:6543/postgres",
  STORAGE_POSTGRES_URL: "postgres://prod-user:prod-pass@prod-db.example.com:6543/postgres",
  SUPABASE_URL: "https://prod-project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "prod-service-key",
  AUTH_SECRET: "production-secret-0123456789abcdef",
  R2_ACCOUNT_ID: "0123456789abcdef0123456789abcdef",
  R2_ACCESS_KEY_ID: "prod-r2-id",
  R2_SECRET_ACCESS_KEY: "prod-r2-secret",
  R2_BUCKET: "prod-bucket",
  SMTP_USER: "info@example.com",
  SMTP_PASS: "prod-app-password",
  RESEND_API_KEY: "prod-resend",
  MONDAY_API_TOKEN: "prod-monday",
};
const TEST = {
  PREVIEW_POSTGRES_URL: "postgres://test-user:test-pass@test-db.example.com:6543/postgres",
  PREVIEW_SUPABASE_URL: "https://test-project.supabase.co",
  PREVIEW_SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
  PREVIEW_AUTH_SECRET: "preview-secret-0123456789abcdef",
};
const stub = (vars: Record<string, string>) => Object.entries(vars).forEach(([k, v]) => vi.stubEnv(k, v));
const load = async () => {
  vi.resetModules();
  return {
    clock: await import("@/lib/clock"),
    storage: await import("@/lib/storage"),
    email: await import("@/lib/email"),
    monday: await import("@/lib/monday"),
    session: await import("@/lib/session"),
  };
};
afterEach(() => vi.unstubAllEnvs());

describe("Preview is isolated from production", () => {
  it("uses only its own test database and test Supabase, never the production ones", async () => {
    stub({ ...PROD, ...TEST, VERCEL_ENV: "preview" });
    const { clock } = await load();
    expect(clock.isPreview()).toBe(true);
    expect(clock.databaseUrl()).toBe(TEST.PREVIEW_POSTGRES_URL);
    expect(clock.supabaseUrl()).toBe(TEST.PREVIEW_SUPABASE_URL);
    expect(clock.supabaseKey()).toBe(TEST.PREVIEW_SUPABASE_SERVICE_ROLE_KEY);
  });

  it("without its own test database, Preview has no database at all (it never falls back to production)", async () => {
    stub({ ...PROD, VERCEL_ENV: "preview" });
    const { clock } = await load();
    expect(clock.databaseUrl()).toBeUndefined();
    expect(clock.dbConfigured()).toBe(false);
    expect(clock.supabaseUrl()).toBeUndefined();
    expect(clock.supabaseKey()).toBeUndefined();
  });

  it("customer files (R2), email and monday are off in Preview, even with production keys present", async () => {
    stub({ ...PROD, ...TEST, VERCEL_ENV: "preview" });
    const { storage, email, monday } = await load();
    expect(storage.r2Ready()).toBe(false);
    expect(await storage.putR2("projects", "x.jpg", new Uint8Array([1]), "image/jpeg")).toBeNull();
    expect(email.emailReady()).toBe(false);
    await expect(email.sendEmail("someone@example.com", "s", "b")).rejects.toThrow();
    expect(monday.mondayReady()).toBe(false);
  });

  it("Preview signs logins with its own secret: a Preview login is worthless on the real site", async () => {
    stub({ ...PROD, ...TEST, VERCEL_ENV: "preview" });
    const { session } = await load();
    expect(session.authSecret()).toBe(TEST.PREVIEW_AUTH_SECRET);
    const previewCookie = await session.signSession("u-owner", session.authSecret()!);
    expect(await session.readSession(previewCookie, PROD.AUTH_SECRET)).toBeNull(); // what production would check
    vi.stubEnv("PREVIEW_AUTH_SECRET", "");
    expect(session.authSecret()).toBeNull(); // no Preview secret → no logins, never the production one
  });
});

describe("Production is unchanged", () => {
  it("production reads the same variables as before", async () => {
    stub({ ...PROD, ...TEST, VERCEL_ENV: "production" });
    const { clock, storage, email, monday, session } = await load();
    expect(clock.isPreview()).toBe(false);
    expect(clock.databaseUrl()).toBe(PROD.POSTGRES_URL);
    expect(clock.supabaseUrl()).toBe(PROD.SUPABASE_URL);
    expect(clock.supabaseKey()).toBe(PROD.SUPABASE_SERVICE_ROLE_KEY);
    expect(storage.r2Ready()).toBe(true);
    expect(email.emailReady()).toBe(true);
    expect(monday.mondayReady()).toBe(true);
    expect(session.authSecret()).toBe(PROD.AUTH_SECRET);
  });
  it("a prefixed production variable (STORAGE_POSTGRES_URL from the Supabase link) still works in production", async () => {
    stub({ STORAGE_POSTGRES_URL: PROD.POSTGRES_URL, VERCEL_ENV: "production" });
    vi.stubEnv("POSTGRES_URL", "");
    const { clock } = await load();
    expect(clock.databaseUrl()).toBe(PROD.POSTGRES_URL);
  });
});
