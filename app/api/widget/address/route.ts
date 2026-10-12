import { lookupAddress } from "@/lib/geo";
import { jsonResponse as json } from "@/lib/widget-request";

/**
 * Postcode + huisnummer → volledig adres met coördinaten (PDOK).
 * GET /api/widget/address?postcode=3511AR&huisnummer=50
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const found = await lookupAddress(
    searchParams.get("postcode") ?? "",
    searchParams.get("huisnummer") ?? "",
  );
  if (!found) return json({ error: "Adres niet gevonden." }, 404);
  return json(found);
}
