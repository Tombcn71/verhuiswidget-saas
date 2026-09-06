import { GoogleGenAI, Type } from "@google/genai";
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
- Negeer kleine losse spullen (boeken, servies, decoratie); die gaan in verhuisdozen. Voeg per kamer HOOGUIT ÉÉN regel "Verhuisdozen" toe met een REALISTISCHE, terughoudende schatting: reken grofweg 3 tot 6 dozen voor een normaal ingerichte kamer, 1 tot 2 voor een kale/lege kamer, 0 als er nauwelijks losse spullen zijn. Nooit meer dan 10 dozen per kamer. Verzin geen hoge aantallen.
- Geef per regel een realistische inschatting van het volume in m³ PER STUK (volumeM3), gebaseerd op standaard verhuisvolumes:
  * 2-zitsbank ~1.0, 3-zitsbank ~1.5, fauteuil ~0.6
  * tweepersoonsbed + matras ~1.4, eenpersoonsbed ~0.9
  * eettafel ~0.7, eetkamerstoel ~0.2, bureau ~0.6
  * kledingkast 2-deurs ~1.4, boekenkast ~0.6, dressoir ~0.8
  * koelkast ~0.6, wasmachine ~0.3, tv ~0.15
  * verhuisdoos ~0.08
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
