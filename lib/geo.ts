/**
 * Adres-lookup en afstandsberekening.
 *
 * NL: PDOK Locatieserver (gratis, geen key). Andere landen: alleen handmatige
 * invoer, afstand wordt dan door de klant zelf ingevuld / later gecorrigeerd.
 */

export type GeoAddress = {
  street: string;
  city: string;
  lat: number;
  lon: number;
};

const PDOK =
  "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";

function normalizePostcode(pc: string): string {
  return pc.replace(/\s+/g, "").toUpperCase();
}

/** Zoekt straat, plaats en coördinaten bij een NL postcode + huisnummer. */
export async function lookupDutchAddress(
  postcode: string,
  houseNumber: string,
): Promise<GeoAddress | null> {
  const pc = normalizePostcode(postcode);
  if (!/^\d{4}[A-Z]{2}$/.test(pc) || !houseNumber.trim()) return null;

  const q = `${pc} ${houseNumber.trim()}`;
  const url = `${PDOK}?q=${encodeURIComponent(q)}&fq=type:adres&rows=1&fl=straatnaam,woonplaatsnaam,centroide_ll`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      // Adres verandert zelden — laat Next 'm cachen.
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const doc = data?.response?.docs?.[0];
    if (!doc) return null;

    // centroide_ll = "POINT(lon lat)"
    const m = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(doc.centroide_ll ?? "");
    return {
      street: String(doc.straatnaam ?? ""),
      city: String(doc.woonplaatsnaam ?? ""),
      lon: m ? Number(m[1]) : NaN,
      lat: m ? Number(m[2]) : NaN,
    };
  } catch {
    return null;
  }
}

function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
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

/** Geschatte wegafstand: hemelsbrede afstand × 1.3, afgerond op hele km. */
export function estimateRoadDistanceKm(
  a: { lat: number; lon: number } | null,
  b: { lat: number; lon: number } | null,
): number | null {
  if (
    !a ||
    !b ||
    !Number.isFinite(a.lat) ||
    !Number.isFinite(a.lon) ||
    !Number.isFinite(b.lat) ||
    !Number.isFinite(b.lon)
  ) {
    return null;
  }
  return Math.max(1, Math.round(haversineKm(a, b) * 1.3));
}
