import "server-only";
import { AwsClient } from "aws4fetch";
import { envSuffix } from "./clock";

// Files live in Cloudflare R2 (cheap, no download fees) once its 4 keys are in Vercel.
// Until then — and for files saved before — Supabase Storage (private bucket "estimates").
const base = () => envSuffix("SUPABASE_URL");
const key = () => envSuffix("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY");
const supabaseReady = () => !!(base() && key());

const r2 = () => {
  // Accept the Account ID alone or pasted inside the full "https://<id>.r2.cloudflarestorage.com" link.
  const rawAccount = process.env.R2_ACCOUNT_ID?.trim();
  const account = rawAccount?.match(/[0-9a-f]{32}/i)?.[0] ?? rawAccount, id = process.env.R2_ACCESS_KEY_ID?.trim(), secret = process.env.R2_SECRET_ACCESS_KEY?.trim(), bucket = process.env.R2_BUCKET?.trim();
  if (!account || !id || !secret || !bucket) return null;
  return { url: `https://${account}.r2.cloudflarestorage.com/${bucket}`, client: new AwsClient({ accessKeyId: id, secretAccessKey: secret, service: "s3", region: "auto" }) };
};
export const r2Ready = () => !!r2();
export const storageReady = () => r2Ready() || supabaseReady();
const R2 = "r2:"; // saved paths with this prefix live in R2
const objectUrl = (c: NonNullable<ReturnType<typeof r2>>, folder: string, path: string) => `${c.url}/${folder}/${path.split("/").map(encodeURIComponent).join("/")}`;

export async function uploadFile(bucket: string, path: string, file: File) {
  const c = r2();
  if (c) {
    const res = await c.client.fetch(objectUrl(c, bucket, path), { method: "PUT", headers: { "Content-Type": file.type || "application/pdf" }, body: Buffer.from(await file.arrayBuffer()), signal: AbortSignal.timeout(60000) });
    if (res.ok) return R2 + path;
    console.error("R2 upload failed", res.status, await res.text());
    return null;
  }
  if (!supabaseReady()) return null;
  const res = await fetch(`${base()}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, apikey: key()!, "Content-Type": file.type || "application/pdf", "x-upsert": "true" },
    body: Buffer.from(await file.arrayBuffer()),
  });
  if (!res.ok) {
    console.error("upload failed", res.status, await res.text());
    return null;
  }
  return path;
}

/** A link that works for 10 minutes — files are never public. */
export async function signedUrl(bucket: string, path: string) {
  if (path.startsWith(R2)) {
    const c = r2();
    if (!c) return null;
    const signed = await c.client.sign(`${objectUrl(c, bucket, path.slice(R2.length))}?X-Amz-Expires=600`, { aws: { signQuery: true } });
    return signed.url;
  }
  if (!supabaseReady()) return null;
  const res = await fetch(`${base()}/storage/v1/object/sign/${bucket}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, apikey: key()!, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 600 }),
  });
  if (!res.ok) return null;
  const { signedURL } = (await res.json()) as { signedURL: string };
  return `${base()}/storage/v1${signedURL}`;
}

/** Writes, reads back and deletes a tiny file — tells in plain words what is wrong with the R2 keys. */
export async function testR2(): Promise<string> {
  const c = r2();
  if (!c) {
    const missing = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"].filter((k) => !process.env[k]?.trim());
    return `Failed: missing in Vercel — ${missing.join(", ")}`;
  }
  const looksLikeName = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"].filter((k) => /^R2_/i.test(process.env[k]!.trim()));
  if (looksLikeName.length) return `Failed: ${looksLikeName.join(", ")} has the name as its value — paste the code from Cloudflare instead.`;
  const shape = [
    ["R2_ACCOUNT_ID", /[0-9a-f]{32}/i, "32 letters/numbers — Cloudflare → R2 → Overview → Account ID (right side)"],
    ["R2_ACCESS_KEY_ID", /^[0-9a-f]{32}$/i, "32 letters/numbers — shown once when you create the R2 API token"],
    ["R2_SECRET_ACCESS_KEY", /^[0-9a-f]{64}$/i, "64 letters/numbers — shown once when you create the R2 API token"],
  ] as const;
  const bad = shape.filter(([k, re]) => !re.test(process.env[k]!.trim()));
  if (bad.length) return `Failed: ${bad.map(([k, , hint]) => `${k} doesn't look right (should be ${hint})`).join(" · ")}`;
  const url = objectUrl(c, "_check", "hello.txt");
  try {
    const put = await c.client.fetch(url, { method: "PUT", body: "ok", signal: AbortSignal.timeout(15000) });
    if (!put.ok) {
      const body = await put.text();
      const code = body.match(/<Code>([^<]+)/)?.[1] ?? `HTTP ${put.status}`;
      const why: Record<string, string> = {
        InvalidAccessKeyId: "R2_ACCESS_KEY_ID is wrong",
        SignatureDoesNotMatch: "R2_SECRET_ACCESS_KEY is wrong",
        NoSuchBucket: "R2_BUCKET name doesn't match the bucket in Cloudflare",
        AccessDenied: "the API token has no Read & Write permission on this bucket",
        Unauthorized: "the API token keys are wrong",
      };
      return `Failed: ${why[code] ?? code}`;
    }
    const get = await c.client.fetch(url, { signal: AbortSignal.timeout(15000) });
    await c.client.fetch(url, { method: "DELETE", signal: AbortSignal.timeout(15000) });
    return get.ok && (await get.text()) === "ok" ? "Done ✓ Cloudflare R2 works — new files are saved there" : "Failed: could write but not read back";
  } catch {
    return "Failed: can't reach Cloudflare — check R2_ACCOUNT_ID (Cloudflare → R2 → Overview → Account ID)";
  }
}
