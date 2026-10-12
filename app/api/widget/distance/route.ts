import { drivingDistanceKm } from "@/lib/geo";
import { jsonResponse as json } from "@/lib/widget-request";

function point(value: string | null) {
  const [lat, lon] = (value ?? "").split(",").map(Number);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

/**
 * Rij-afstand tussen twee punten (OpenRouteService). `km` is null als het niet
 * lukt; de klant vult de afstand dan zelf in.
 * GET /api/widget/distance?from=52.09,5.11&to=52.37,4.89
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = point(searchParams.get("from"));
  const to = point(searchParams.get("to"));
  if (!from || !to) return json({ km: null }, 400);
  return json({ km: await drivingDistanceKm(from, to) });
}
