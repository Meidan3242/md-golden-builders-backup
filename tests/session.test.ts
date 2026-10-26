import { describe, expect, it } from "vitest";
import { readSession, signSession } from "@/lib/session";

const SECRET = "test-secret-for-unit-tests-123456";

describe("sessions", () => {
  it("each login gets its own id (so one device can be logged out on the server)", async () => {
    const a = await readSession(await signSession("u-owner", SECRET), SECRET);
    const b = await readSession(await signSession("u-owner", SECRET), SECRET);
    expect(a?.u).toBe("u-owner");
    expect(a?.sid).toMatch(/^[\w-]{20,}$/);
    expect(a?.sid).not.toBe(b?.sid);
    expect(a!.exp).toBeGreaterThan(Date.now());
  });
  it("a changed cookie or another secret is refused", async () => {
    const t = await signSession("u-office", SECRET);
    const [body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body!, "base64url").toString()), u: "u-owner" })).toString("base64url");
    expect(await readSession(`${forged}.${sig}`, SECRET)).toBeNull();
    expect(await readSession(t, "another-secret-0123456789abcdef")).toBeNull();
  });
});
