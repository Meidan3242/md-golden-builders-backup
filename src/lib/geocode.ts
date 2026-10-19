import "server-only";

/**
 * Address → map point with the free U.S. Census geocoder (no key, US addresses only).
 * GEOCODER_URL only for local testing against a stand-in.
 */
export async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const base = process.env.GEOCODER_URL ?? "https://geocoding.geo.census.gov";
  const url = `${base}/geocoder/locations/onelineaddress?benchmark=Public_AR_Current&format=json&address=${encodeURIComponent(address)}`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`geocoder ${res.status}`);
  const json = (await res.json()) as { result?: { addressMatches?: { coordinates: { x: number; y: number } }[] } };
  const c = json.result?.addressMatches?.[0]?.coordinates;
  // Southern California only — anything else is a wrong match.
  return c && c.y > 32 && c.y < 34.5 && c.x > -118.5 && c.x < -116 ? { lat: c.y, lng: c.x } : null;
}
