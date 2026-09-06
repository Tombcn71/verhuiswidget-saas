/**
 * Geocodeert een vrij ingevoerd adres via de PDOK Locatieserver (gratis, NL)
 * en schat de rij-afstand tussen twee adressen.
 */

type LatLon = { lat: number; lon: number };

const PDOK =
  "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?fl=centroide_ll&rows=1&q=";

export async function geocode(address: string): Promise<LatLon | null> {
  const q = address.trim();
  if (q.length < 4) return null;
  try {
    const res = await fetch(PDOK + encodeURIComponent(q), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      response?: { docs?: { centroide_ll?: string }[] };
    };
    const point = data.response?.docs?.[0]?.centroide_ll;
    // formaat: "POINT(5.12143 52.09074)" -> lon lat
    const m = point?.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
    if (!m) return null;
    return { lon: Number(m[1]), lat: Number(m[2]) };
  } catch {
    return null;
  }
}

function haversineKm(a: LatLon, b: LatLon): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Geeft de geschatte rij-afstand in km tussen twee adressen (hemelsbreed × 1.3
 * als wegfactor), of `null` als één van beide niet te geocoderen is.
 */
export async function estimateDistanceKm(
  fromAddress: string,
  toAddress: string,
): Promise<number | null> {
  const [a, b] = await Promise.all([geocode(fromAddress), geocode(toAddress)]);
  if (!a || !b) return null;
  return Math.round(haversineKm(a, b) * 1.3);
}
