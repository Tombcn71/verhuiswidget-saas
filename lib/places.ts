/**
 * Google Places API (New): verhuisbedrijven zoeken per plaats, voor de
 * verkoop-CRM van moverAI. Sleutel: GOOGLE_PLACES_API_KEY.
 */

export type PlaceResult = {
  placeId: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
};

const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
// Alleen de velden die we gebruiken (bepaalt ook de prijs per zoekopdracht).
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "nextPageToken",
].join(",");

export class PlacesConfigError extends Error {}

type ApiPlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  addressComponents?: { longText?: string; types?: string[] }[];
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
};

/** Eén pagina (max. 20) resultaten voor "verhuisbedrijf in <plaats>". */
export async function searchMovers(
  city: string,
  pageToken?: string | null,
): Promise<{ places: PlaceResult[]; nextPageToken: string | null }> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new PlacesConfigError("GOOGLE_PLACES_API_KEY ontbreekt.");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: `verhuisbedrijf in ${city}`,
      languageCode: "nl",
      regionCode: "NL",
      pageSize: 20,
      ...(pageToken ? { pageToken } : {}),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Google Places gaf ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as { places?: ApiPlace[]; nextPageToken?: string };

  const places = (data.places ?? [])
    // Gesloten bedrijven overslaan.
    .filter((p) => p.businessStatus !== "CLOSED_PERMANENTLY")
    .map((p) => ({
      placeId: p.id,
      name: p.displayName?.text?.trim() || "Onbekend",
      address: p.formattedAddress ?? null,
      city: p.addressComponents?.find((c) => c.types?.includes("locality"))?.longText ?? null,
      phone: p.nationalPhoneNumber ?? null,
      website: p.websiteUri ?? null,
      rating: p.rating ?? null,
      reviewCount: p.userRatingCount ?? null,
    }));
  return { places, nextPageToken: data.nextPageToken ?? null };
}

/** Plaatsen die automatisch worden afgewerkt, van groot naar klein. */
export const NL_CITIES = [
  "Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", "Groningen", "Tilburg",
  "Almere", "Breda", "Nijmegen", "Apeldoorn", "Arnhem", "Haarlem", "Enschede",
  "Haarlemmermeer", "Amersfoort", "Zaanstad", "Den Bosch", "Zwolle", "Leiden", "Zoetermeer",
  "Leeuwarden", "Maastricht", "Dordrecht", "Ede", "Alphen aan den Rijn", "Alkmaar",
  "Westland", "Emmen", "Delft", "Venlo", "Deventer", "Sittard-Geleen", "Helmond",
  "Oss", "Amstelveen", "Hilversum", "Súdwest-Fryslân", "Heerlen", "Nissewaard",
  "Hengelo", "Purmerend", "Roosendaal", "Schiedam", "Lelystad", "Leidschendam-Voorburg",
  "Almelo", "Gouda", "Hoorn", "Vlaardingen", "Assen", "Bergen op Zoom", "Capelle aan den IJssel",
  "Veenendaal", "Katwijk", "Zeist", "Nieuwegein", "Roermond", "Den Helder", "Doetinchem",
  "Hoogeveen", "Terneuzen", "Middelburg", "Vlissingen", "Kampen", "Harderwijk", "Zutphen",
  "Goes", "Tiel", "Heerenveen", "Drachten", "Sneek", "Meppel", "Wageningen", "Weert",
  "Uden", "Veghel", "Bussum", "Woerden", "Barneveld", "Culemborg", "Winterswijk",
];
