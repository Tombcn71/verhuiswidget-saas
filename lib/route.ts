import type { Company } from "@/lib/db";
import { drivingDistanceKm, type GeoPoint } from "@/lib/geo";

/**
 * Aan- en afrijkilometers: vestiging → eerste adres, en van het laatste adres
 * terug naar de vestiging. 0 als het bedrijf geen vestigingsadres heeft of de
 * route niet te berekenen is (dan komt er simpelweg geen aanrijregel).
 */
export async function approachKm(
  company: Pick<Company, "baseLat" | "baseLon">,
  first: GeoPoint | null | undefined,
  last: GeoPoint | null | undefined,
): Promise<number> {
  if (company.baseLat == null || company.baseLon == null || !first || !last) return 0;
  const base = { lat: company.baseLat, lon: company.baseLon };
  const [heen, terug] = await Promise.all([
    drivingDistanceKm(base, first),
    drivingDistanceKm(last, base),
  ]);
  return heen == null || terug == null ? 0 : heen + terug;
}
