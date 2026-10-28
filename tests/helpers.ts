import { vi } from "vitest";
import { signSession } from "@/lib/session";

export const SECRET = "test-secret-for-unit-tests-123456";

/** Fakes the logged-in person's cookie for code that reads next/headers. */
export async function loginAs(userId: string | null) {
  const token = userId ? await signSession(userId, SECRET) : undefined;
  const jar = { get: (n: string) => (n === "mdg_session" && token ? { value: token } : undefined), set: vi.fn(), delete: vi.fn() };
  const { cookies } = await import("next/headers");
  vi.mocked(cookies).mockResolvedValue(jar as never);
  return token;
}

/** A stand-in for the postgres.js tag: records every query; `answer` decides what each returns. */
export function fakeSql(answer: (q: string, values: unknown[]) => unknown[] = () => []) {
  const calls: { q: string; values: unknown[] }[] = [];
  const tag = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    const q = strings.join("?");
    calls.push({ q, values });
    return Promise.resolve(answer(q, values));
  }) as unknown as Record<string, unknown> & ((s: TemplateStringsArray, ...v: unknown[]) => Promise<unknown[]>);
  tag.json = (x: unknown) => x;
  tag.begin = async (fn: (tx: unknown) => unknown) => fn(tag);
  return { tag, calls };
}
