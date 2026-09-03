import { GoogleGenAI, Type } from "@google/genai";
import type { InventoryItem } from "@/lib/db/schema";

export type PhotoInput = {
  /** Base64-encoded afbeelding (zonder data:-prefix) */
  data: string;
  mimeType: string;
  /** Kamernaam waar de foto bij hoort */
  room: string;
};

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const PROMPT = `Je bent een ervaren verhuisopnemer. Je krijgt foto's van kamers die verhuisd of ontruimd moeten worden.

Analyseer ALLE foto's samen en maak één gecombineerde inventarislijst van de meubels en grote spullen die verhuisd moeten worden.

Regels:
- Tel identieke objecten op tot één regel met een aantal (quantity).
- Negeer kleine losse spullen (boeken, servies, decoratie); die gaan in verhuisdozen. Voeg wél een geschatte regel "Verhuisdozen" toe op basis van de hoeveelheid spullen die je ziet.
- Geef per regel een realistische inschatting van het volume in m³ PER STUK (volumeM3), gebaseerd op standaard verhuisvolumes:
  * 2-zitsbank ~1.0, 3-zitsbank ~1.5, fauteuil ~0.6
  * tweepersoonsbed + matras ~1.4, eenpersoonsbed ~0.9
  * eettafel ~0.7, eetkamerstoel ~0.2, bureau ~0.6
  * kledingkast 2-deurs ~1.4, boekenkast ~0.6, dressoir ~0.8
  * koelkast ~0.6, wasmachine ~0.3, tv ~0.15
  * verhuisdoos ~0.08
- category is één van: "woonkamer", "slaapkamer", "keuken", "badkamer", "kantoor", "berging", "overig".
- Gebruik Nederlandse namen.
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
        },
        required: ["name", "quantity", "volumeM3", "category"],
        propertyOrdering: ["name", "quantity", "volumeM3", "category"],
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
      };
    })
    .filter((item) => item.volumeM3 > 0);
}
