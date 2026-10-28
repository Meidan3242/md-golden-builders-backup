import { describe, expect, it } from "vitest";
import { isLocked, MAX_PER_EMAIL_IP, MAX_PER_IP } from "@/lib/login-guard";

describe("login attempt limits", () => {
  it("5 wrong passwords for the same email from the same place → wait", () => {
    expect(isLocked(MAX_PER_EMAIL_IP - 1, MAX_PER_EMAIL_IP - 1)).toBe(false);
    expect(isLocked(MAX_PER_EMAIL_IP, MAX_PER_EMAIL_IP)).toBe(true);
  });
  it("20 wrong attempts from one place, any emails → wait", () => {
    expect(isLocked(0, MAX_PER_IP - 1)).toBe(false);
    expect(isLocked(0, MAX_PER_IP)).toBe(true);
  });
  it("limits stay small enough to stop guessing", () => {
    expect(MAX_PER_EMAIL_IP).toBeLessThanOrEqual(10);
    expect(MAX_PER_IP).toBeLessThanOrEqual(50);
  });
});
