import { GoogleGenAI, Type } from "@google/genai";
import type { InvoiceJob } from "@/lib/tariff-derive";
import type {
  ClearanceFill,
  ClearanceItem,
  InventoryItem,
} from "@/lib/db/schema";

export type PhotoInput = {
  /** Base64-encoded afbeelding (zonder data:-prefix) */
  data: string;
  mimeType: string;
  /** Kamernaam waar de foto bij hoort */
  room: string;
};

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5);

const PROMPT = `Je bent een ervaren verhuisopnemer. Je krijgt foto's van kamers die verhuisd of ontruimd moeten worden.

Analyseer ALLE foto's samen en maak één gecombineerde inventarislijst van de meubels en grote spullen die verhuisd moeten worden.

Regels:
- Tel identieke objecten op tot één regel met een aantal (quantity).
- Neem ook wandobjecten mee die los ingepakt en vervoerd moeten worden: schilderijen, ingelijste posters/fotolijsten (groter dan A4), spiegels, wandklokken, wandlampen. Tel ze als aparte regels. Een schilderij/spiegel is ~0.05 m³ per stuk, groot schilderij ~0.15.
- Neem ook losse grotere spullen mee als aparte regels: staande lampen, grote planten, vloerkleden, fietsen, wasrekken, stofzuigers, tuingereedschap, koffers.
- Negeer kleine losse spullen (boeken, servies, kleding, decoratie); die gaan in verhuisdozen. Daarvoor maak je twee soorten doosregels (volumeM3 0.1 per doos):
  1. KASTINHOUD: zet DIRECT NA elk meubel met opbergruimte een regel "Inhoud <meubelnaam in kleine letters> (verhuisdozen)", bijv. "Inhoud kledingkast 2-deurs (verhuisdozen)". In de kast kun je niet kijken; schat de inhoud uit het formaat van het meubel. quantity is het totale aantal dozen voor alle stuks samen. Richtlijn per stuk:
     * kledingkast 2-deurs 6, kledingkast 3-deurs 9, kledingkast 4-deurs 12
     * boekenkast/vakkenkast 5 (meer als hij zichtbaar vol staat), vitrinekast 3
     * dressoir 4, ladekast 3, tv-meubel 2, nachtkastje 1, bureau met lades 2
     * keukenkastjes (onder- en bovenkasten samen) 2 per strekkende meter keuken; aparte voorraadkast 3
     * stellingkast in berging/garage/schuur: tel de dozen en spullen die erop staan
     Geen inhoudsregel voor meubels zonder opbergruimte (bank, bed, tafel, stoel).
  2. LOSSE SPULLEN: per kamer HOOGUIT ÉÉN regel "Losse spullen (verhuisdozen)" voor wat niet in een kast zit: dozen die al klaarstaan, speelgoed, stapels, spullen op de grond of op planken. Een opgeruimde kamer 0 tot 2, een volle kamer meer; op een volle zolder of in een volle garage kan het 10 tot 25 zijn.
  Nooit meer dan 30 dozen per regel.
- Geef per regel een realistische inschatting van het volume in m³ PER STUK (volumeM3). Gebruik de laadvolumes die verhuizers aanhouden (inclusief de ruimte die een meubel in de wagen inneemt):
  * 2-zitsbank ~1.5, 3-zitsbank ~2.0, hoekbank ~3.0, fauteuil ~0.8
  * tweepersoonsbed + matras ~2.0, eenpersoonsbed ~1.0, stapelbed ~1.5, nachtkastje ~0.2
  * eettafel ~1.0, eetkamerstoel ~0.25, bureau ~1.0, bureaustoel ~0.4, salontafel ~0.4
  * kledingkast 2-deurs ~1.8, 3-deurs ~2.5, boekenkast ~1.0, dressoir ~1.2, ladekast ~0.6, tv-meubel ~0.6
  * koelkast ~1.0, Amerikaanse koelkast ~1.5, vriezer ~0.8, wasmachine ~0.5, droger ~0.5, tv ~0.2, piano ~2.0
  * fiets ~0.6, grasmaaier ~0.4
  * verhuisdoos ~0.1
- category is één van: "woonkamer", "slaapkamer", "keuken", "badkamer", "kantoor", "berging", "overig".
- Zet bij elk item de exacte kamernaam (room) waar je het zag, precies zoals aangegeven vlak boven de foto ("Foto uit kamer: ..."). Als een item op meerdere foto's uit verschillende kamers staat, kies de kamer waar het thuishoort.
- Geef bij elk item de geschatte positie in de EERSTE foto van die kamer als x en y: het midden van het object, uitgedrukt als fractie van 0 tot 1 (x = links→rechts, y = boven→onder). Als je het niet kunt plaatsen, gebruik x=0.5 en y=0.5.
- Gebruik Nederlandse namen.
- Zet needsInfo op true als je het formaat/de inhoud van een object niet goed kunt inschatten van de foto (bijv. bank waarvan je het aantal zitplaatsen niet ziet, een kast waarvan je niet weet hoe vol die zit). De widget vraagt de klant dan om verduidelijking.
- Wees compleet maar verzin geen objecten die niet op de foto's staan.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          quantity: { type: Type.INTEGER },
          volumeM3: { type: Type.NUMBER },
          category: { type: Type.STRING },
          room: { type: Type.STRING },
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER },
          needsInfo: { type: Type.BOOLEAN },
        },
        required: ["name", "quantity", "volumeM3", "category", "room", "x", "y", "needsInfo"],
        propertyOrdering: ["name", "quantity", "volumeM3", "category", "room", "x", "y", "needsInfo"],
      },
    },
  },
  required: ["items"],
} as const;

/**
 * Stuurt de geüploade foto's naar Gemini en geeft een gestructureerde inventarislijst terug.
 */
export async function analyzePhotos(photos: PhotoInput[]): Promise<InventoryItem[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY ontbreekt.");
  }
  if (photos.length === 0) return [];

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [{ text: PROMPT }];

  for (const photo of photos) {
    parts.push({ text: `Foto uit kamer: ${photo.room}` });
    parts.push({ inlineData: { mimeType: photo.mimeType, data: photo.data } });
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts }],
    config: {
      responseMimeType: "application/json",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: responseSchema as any,
      temperature: 0.2,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini gaf een leeg antwoord terug.");

  let parsed: { items?: unknown };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Kon het antwoord van Gemini niet als JSON verwerken.");
  }

  const rawItems = Array.isArray(parsed.items) ? parsed.items : [];

  return rawItems
    .map((raw): InventoryItem => {
      const r = raw as Record<string, unknown>;
      return {
        name: String(r.name ?? "Onbekend object"),
        quantity: Math.max(1, Math.round(Number(r.quantity) || 1)),
        volumeM3: Math.max(0, Number(r.volumeM3) || 0),
        category: String(r.category ?? "overig"),
        room: r.room ? String(r.room) : undefined,
        x: clamp01(Number(r.x)),
        y: clamp01(Number(r.y)),
        needsInfo: r.needsInfo === true ? true : undefined,
      };
    })
    .filter((item) => item.volumeM3 > 0);
}

// --- Tarieven uit een factuur/offerte ----------------------------------------

const TARIFF_PROMPT = `Je krijgt een of meer facturen of offertes van een Nederlands verhuisbedrijf. Haal daaruit de tarieven die dit bedrijf hanteert, zodat we die in hun offertesoftware kunnen instellen.

Regels:
- Alle bedragen in euro's EXCLUSIEF btw. Staat een bedrag alleen inclusief 21% btw vermeld, deel het dan door 1,21.
- pricingMode: "uur" als het bedrijf rekent met verhuizers × uren × uurtarief; "m3" als het een prijs per m³ (kubieke meter) rekent waar mankracht in zit; null als het niet duidelijk is.
- hourlyRatePerMover: uurtarief PER verhuizer.
  * Staan er ploegtarieven voor twee ploeggroottes (bijv. "2 man + wagen €115/u, 3 man + wagen €159/u"): hourlyRatePerMover = het verschil per extra man (159 − 115 = 44), en vanRate = wat er overblijft voor de wagen (115 − 2 × 44 = 27, vanRateUnit "uur").
  * Staat er maar één ploegtarief (bijv. "2 man + wagen €110 per uur"): deel het door het aantal verhuizers en laat vanRate null.
- vanRate + vanRateUnit: alleen als de verhuiswagen een APARTE regel of apart tarief is: per "uur", per "dag" of per "rit".
- pricePerM3: prijs per m³ inboedel, alleen als die er staat.
- baseFee: voorrijkosten of vast starttarief per klus.
- pricePerKm: prijs per kilometer.
- liftFee: verhuislift per inzet/adres. packingFee: inpakservice. assemblyFee: (de)montage van meubels. storagePerMonth: opslag per maand. minPrice: minimumprijs voor een klus. rushSurcharge: spoedtoeslag als vast bedrag.
- boxPrice: prijs per verhuisdoos (koop of levering) per stuk.
- minHours: minimum aantal uren ("minimaal 3 uur"). roundingMinutes: 15 bij "per kwartier", 30 bij "per half uur", 60 bij "per uur" afgerekend.
- saturdaySurchargePct / sundaySurchargePct: weekendtoeslag in procenten. Geldt één weekendtoeslag voor het hele weekend, vul hem bij allebei in.
- volumeM3, hours, movers: het volume in m³, het aantal gewerkte uren en het aantal verhuizers van de klus op het document, als die vermeld staan.
- km: de afstand van de rit (ophaal- naar bezorgadres) op het document.
- travelIncluded: true als op het document staat dat de uren inclusief reistijd zijn (bijv. "vanaf vertrek depot tot terugkomst"), false als reistijd apart wordt gerekend of expliciet niet in de uren zit, null als het niet te zien is.
- Gebruik null voor alles wat er niet op staat. Verzin of schat geen bedragen.
- summary: één of twee zinnen in het Nederlands, aan de verhuizer gericht ("je"), over wat je gevonden hebt en wat niet.
- Negeer namen, adressen en andere klantgegevens; die zijn niet nodig.`;

const num = { type: Type.NUMBER, nullable: true };

const tariffResponseSchema = {
  type: Type.OBJECT,
  properties: {
    pricingMode: { type: Type.STRING, nullable: true, enum: ["uur", "m3"] },
    hourlyRatePerMover: num,
    pricePerM3: num,
    baseFee: num,
    pricePerKm: num,
    liftFee: num,
    packingFee: num,
    assemblyFee: num,
    storagePerMonth: num,
    minPrice: num,
    rushSurcharge: num,
    boxPrice: num,
    vanRate: num,
    vanRateUnit: { type: Type.STRING, nullable: true, enum: ["uur", "dag", "rit"] },
    minHours: num,
    roundingMinutes: num,
    saturdaySurchargePct: num,
    sundaySurchargePct: num,
    volumeM3: num,
    hours: num,
    movers: num,
    km: num,
    travelIncluded: { type: Type.BOOLEAN, nullable: true },
    summary: { type: Type.STRING },
  },
  required: ["summary"],
} as const;

export type ExtractedTariffs = {
  pricingMode: "uur" | "m3" | null;
  hourlyRatePerMover: number | null;
  pricePerM3: number | null;
  baseFee: number | null;
  pricePerKm: number | null;
  liftFee: number | null;
  packingFee: number | null;
  assemblyFee: number | null;
  storagePerMonth: number | null;
  minPrice: number | null;
  rushSurcharge: number | null;
  boxPrice: number | null;
  vanRate: number | null;
  vanRateUnit: "uur" | "dag" | "rit" | null;
  minHours: number | null;
  roundingMinutes: 15 | 30 | 60 | null;
  saturdaySurchargePct: number | null;
  sundaySurchargePct: number | null;
  /** De klus op het document; daaruit volgen tempo, ploeg en reistijd (lib/tariff-derive). */
  job: InvoiceJob;
  summary: string;
};

const money = (v: unknown): number | null => {
  const n = Number(v);
  return v != null && Number.isFinite(n) && n >= 0 && n < 100000 ? Math.round(n * 100) / 100 : null;
};

/** Leest tarieven uit facturen/offertes (pdf of foto). Het bestand wordt niet bewaard. */
export async function extractTariffs(
  files: { data: string; mimeType: string }[],
): Promise<ExtractedTariffs> {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ontbreekt.");

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: TARIFF_PROMPT }, ...files.map((f) => ({ inlineData: f }))],
      },
    ],
    config: {
      responseMimeType: "application/json",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: tariffResponseSchema as any,
      temperature: 0,
    },
  });

  let r: Record<string, unknown>;
  try {
    r = JSON.parse(response.text ?? "");
  } catch {
    throw new Error("Kon het antwoord van Gemini niet als JSON verwerken.");
  }

  const positive = (v: unknown, max: number): number | null => {
    const n = Number(v);
    return v != null && Number.isFinite(n) && n > 0 && n <= max ? n : null;
  };
  const pct = (v: unknown): number | null => {
    const n = Number(v);
    return v != null && Number.isFinite(n) && n >= 0 && n <= 200 ? Math.round(n) : null;
  };
  const rounding = Number(r.roundingMinutes);

  return {
    pricingMode: r.pricingMode === "uur" || r.pricingMode === "m3" ? r.pricingMode : null,
    hourlyRatePerMover: money(r.hourlyRatePerMover),
    pricePerM3: money(r.pricePerM3),
    baseFee: money(r.baseFee),
    pricePerKm: money(r.pricePerKm),
    liftFee: money(r.liftFee),
    packingFee: money(r.packingFee),
    assemblyFee: money(r.assemblyFee),
    storagePerMonth: money(r.storagePerMonth),
    minPrice: money(r.minPrice),
    rushSurcharge: money(r.rushSurcharge),
    boxPrice: money(r.boxPrice),
    vanRate: money(r.vanRate),
    vanRateUnit:
      r.vanRateUnit === "uur" || r.vanRateUnit === "dag" || r.vanRateUnit === "rit"
        ? r.vanRateUnit
        : null,
    minHours: positive(r.minHours, 12),
    roundingMinutes: rounding === 15 || rounding === 30 || rounding === 60 ? rounding : null,
    saturdaySurchargePct: pct(r.saturdaySurchargePct),
    sundaySurchargePct: pct(r.sundaySurchargePct),
    job: {
      volumeM3: positive(r.volumeM3, 500),
      hours: positive(r.hours, 48),
      movers: positive(r.movers, 8),
      km: positive(r.km, 2000),
      travelIncluded: typeof r.travelIncluded === "boolean" ? r.travelIncluded : null,
    },
    summary: String(r.summary ?? ""),
  };
}

// --- Ontruiming ------------------------------------------------------------

const CLEARANCE_PROMPT = `Je bent een ervaren opnemer voor woningontruimingen. Je krijgt foto's van een woning of ruimte die volledig leeggehaald moet worden.

Bepaal op basis van ALLE foto's samen:
1. fillLevel: hoe vol de woning staat. Kies één van:
   - "minimaal": vrijwel leeg, alleen een paar losse spullen
   - "normaal": normaal bewoond, gebruikelijke hoeveelheid meubels en spullen
   - "vol": veel meubels en spullen, kasten vol, weinig vrije vloer
   - "overvol": extreem vol, opeenstapeling, nauwelijks doorloop (hoarding)
2. items: de grote objecten die afgevoerd moeten worden. Tel identieke objecten op tot één regel met quantity. Geef per regel een size: "small", "medium" of "large".
3. estimatedBoxes: geschat aantal dozen/tassen met losse spullen (kleding, servies, boeken, decoratie).
4. specialItems: bijzondere of fragiele objecten die extra aandacht nodig hebben (bijv. piano, kluis, groot kunstwerk, chemisch afval, koelkast). Lege lijst als er niets bijzonders is.

Wees realistisch, verzin geen objecten die niet zichtbaar zijn.`;

const clearanceResponseSchema = {
  type: Type.OBJECT,
  properties: {
    fillLevel: { type: Type.STRING },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          quantity: { type: Type.INTEGER },
          size: { type: Type.STRING },
        },
        required: ["name", "quantity", "size"],
        propertyOrdering: ["name", "quantity", "size"],
      },
    },
    estimatedBoxes: { type: Type.INTEGER },
    specialItems: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["fillLevel", "items", "estimatedBoxes", "specialItems"],
} as const;

export type ClearanceAnalysis = {
  fillLevel: ClearanceFill;
  items: ClearanceItem[];
  estimatedBoxes: number;
  specialItems: string[];
};

const FILLS: ClearanceFill[] = ["minimaal", "normaal", "vol", "overvol"];
const SIZES = ["small", "medium", "large"] as const;

export async function analyzeClearance(
  photos: PhotoInput[],
): Promise<ClearanceAnalysis> {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ontbreekt.");

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [{ text: CLEARANCE_PROMPT }];
  for (const photo of photos) {
    parts.push({ inlineData: { mimeType: photo.mimeType, data: photo.data } });
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts }],
    config: {
      responseMimeType: "application/json",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: clearanceResponseSchema as any,
      temperature: 0.2,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini gaf een leeg antwoord terug.");

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Kon het antwoord van Gemini niet als JSON verwerken.");
  }

  const fillLevel = FILLS.includes(parsed.fillLevel as ClearanceFill)
    ? (parsed.fillLevel as ClearanceFill)
    : "normaal";

  const items: ClearanceItem[] = (
    Array.isArray(parsed.items) ? parsed.items : []
  )
    .map((raw): ClearanceItem => {
      const r = raw as Record<string, unknown>;
      const size = SIZES.includes(r.size as (typeof SIZES)[number])
        ? (r.size as ClearanceItem["size"])
        : "medium";
      return {
        name: String(r.name ?? "Onbekend object"),
        quantity: Math.max(1, Math.round(Number(r.quantity) || 1)),
        size,
      };
    })
    .filter((i) => i.name && i.name !== "Onbekend object");

  return {
    fillLevel,
    items,
    estimatedBoxes: Math.max(0, Math.round(Number(parsed.estimatedBoxes) || 0)),
    specialItems: (Array.isArray(parsed.specialItems)
      ? parsed.specialItems
      : []
    ).map((s) => String(s)),
  };
}
