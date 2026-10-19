"use server";

import { revalidatePath } from "next/cache";
import { loggedInUser } from "@/lib/data";
import { migrate, schemaVersion, sql } from "@/lib/db";
import { geocode } from "@/lib/geocode";

/** Finds map pins for projects that don't have one yet (~20s per call); returns how many are still left. */
export async function findMapPins(): Promise<{ done: number; left: number; failed?: number; error?: string }> {
  const me = await loggedInUser();
  if (!me) return { done: 0, left: 0, error: "Please log in again." };
  if (((await schemaVersion()) ?? 0) < 7) await migrate();
  const db = sql();
  const t0 = Date.now();
  const todo = await db`select id, address, city, geo_status from projects where geo_status is null or geo_status like 'retry%'
                        order by (geo_status is null) desc, signed_at desc limit 40`;
  let done = 0;
  let failed = 0;
  for (const p of todo) {
    if (Date.now() - t0 > 20_000) break;
    const address = String(p.address ?? "").trim();
    let pin: { lat: number; lng: number } | null = null;
    if (address) {
      try {
        pin = await geocode(/\bCA\b/i.test(address) ? address : `${address}, ${p.city || "San Diego"}, CA`);
      } catch {
        // The map service didn't answer for this one: try it again later (3 tries), keep going with the rest.
        const tries = Number(String(p.geo_status ?? "").replace("retry", "")) || 0;
        await db`update projects set geo_status = ${tries >= 2 ? "none" : `retry${tries + 1}`} where id = ${p.id}`;
        failed++;
        continue;
      }
    }
    await db`update projects set lat = ${pin?.lat ?? null}, lng = ${pin?.lng ?? null}, geo_status = ${pin ? "ok" : "none"} where id = ${p.id}`;
    done++;
  }
  const [{ left }] = await db`select count(*)::int as left from projects where geo_status is null or geo_status like 'retry%'`;
  if (!left) revalidatePath("/map");
  return { done, left, failed };
}
