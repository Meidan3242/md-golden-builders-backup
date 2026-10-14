import "server-only";
import { envSuffix } from "./clock";

// Supabase Storage over plain HTTPS (private bucket "estimates"). Keys come from the Vercel ↔ Supabase link.
const base = () => envSuffix("SUPABASE_URL");
const key = () => envSuffix("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY");
export const storageReady = () => !!(base() && key());

export async function uploadFile(bucket: string, path: string, file: File) {
  if (!storageReady()) return null;
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
  if (!storageReady()) return null;
  const res = await fetch(`${base()}/storage/v1/object/sign/${bucket}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, apikey: key()!, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 600 }),
  });
  if (!res.ok) return null;
  const { signedURL } = (await res.json()) as { signedURL: string };
  return `${base()}/storage/v1${signedURL}`;
}
