import { afterEach, describe, expect, it, vi } from "vitest";
import config, { CONTENT_SECURITY_POLICY, SECURITY_HEADERS } from "../next.config";

const header = (k: string) => SECURITY_HEADERS.find((h) => h.key === k)?.value;

describe("security headers", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("pages can't be framed (contract signing can't be overlaid)", () => {
    expect(header("X-Frame-Options")).toBe("DENY");
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'");
  });
  it("no sniffing, no plugins, no other script origins, no server banner", () => {
    expect(header("X-Content-Type-Options")).toBe("nosniff");
    expect(CONTENT_SECURITY_POLICY).toContain("object-src 'none'");
    expect(CONTENT_SECURITY_POLICY).toMatch(/script-src 'self' 'unsafe-inline'(;|$)/);
    expect(CONTENT_SECURITY_POLICY).toContain("form-action 'self'");
    expect(config.poweredByHeader).toBe(false);
    expect(header("Strict-Transport-Security")).toMatch(/max-age=\d+/);
  });
  it("private files and map tiles still load", () => {
    expect(CONTENT_SECURITY_POLICY).toContain("https://*.r2.cloudflarestorage.com");
    expect(CONTENT_SECURITY_POLICY).toContain("https://tile.openstreetmap.org");
  });
  it("the policy is sent on every page of a production build", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const [rule] = await config.headers!();
    expect(rule!.source).toBe("/:path*");
    expect(rule!.headers.map((h) => h.key)).toContain("Content-Security-Policy");
  });
});
