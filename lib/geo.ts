/**
 * Adressen via de PDOK Locatieserver (gratis, officieel NL-adresregister) en
 * rij-afstanden via OpenRouteService (gratis Standard-plan, `ORS_API_KEY`).
 */

export type GeoPoint = { lat: number; lon: number };

export type ResolvedAddress = GeoPoint & {
  /** Bijv. "Oudegracht 50, 3511AR Utrecht". */
  label: string;
};

const PDOK = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";
const ORS = "https://api.openrouteservice.org/v2/directions/driving-car";

/** "3511 ar" → "3511AR"; null als het geen geldige NL-postcode is. */
export function normalizePostcode(value: string): string | null {
  const pc = value.replace(/\s+/g, "").toUpperCase();
  return /^[1-9]\d{3}[A-Z]{2}$/.test(pc) ? pc : null;
}

/**
 * Zoekt een adres exact op postcode + huisnummer. Geeft null als het adres
 * niet bestaat (dus nooit een "ongeveer goed" adres in een andere plaats).
 */
export async function lookupAddress(
  postcode: string,
  houseNumber: string,
): Promise<ResolvedAddress | null> {
  const pc = normalizePostcode(postcode);
  const nr = houseNumber.trim().match(/^\d+/)?.[0];
  if (!pc || !nr) return null;

  const params = new URLSearchParams({ fl: "weergavenaam,centroide_ll", rows: "1" });
  params.append("fq", "type:adres");
  params.append("fq", `postcode:${pc}`);
  params.append("fq", `huisnummer:${nr}`);

  try {
    const res = await fetch(`${PDOK}?${params}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      response?: { docs?: { weergavenaam?: string; centroide_ll?: string }[] };
    };
    const doc = data.response?.docs?.[0];
    // formaat: "POINT(5.12143 52.09074)" -> lon lat
    const m = doc?.centroide_ll?.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
    if (!doc?.weergavenaam || !m) return null;
    return { label: doc.weergavenaam, lon: Number(m[1]), lat: Number(m[2]) };
  } catch {
    return null;
  }
}

/**
 * Rij-afstand over de weg in hele km via OpenRouteService, of null als dat niet
 * lukt (geen sleutel, limiet bereikt, dienst niet bereikbaar).
 */
export async function drivingDistanceKm(a: GeoPoint, b: GeoPoint): Promise<number | null> {
  const key = process.env.ORS_API_KEY;
  if (!key) return null;

  const params = new URLSearchParams({
    api_key: key,
    start: `${a.lon},${a.lat}`,
    end: `${b.lon},${b.lat}`,
  });
  try {
    const res = await fetch(`${ORS}?${params}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: { properties?: { summary?: { distance?: number } } }[];
    };
    const meters = data.features?.[0]?.properties?.summary?.distance;
    return typeof meters === "number" ? Math.round(meters / 1000) : null;
  } catch {
    return null;
  }
}
