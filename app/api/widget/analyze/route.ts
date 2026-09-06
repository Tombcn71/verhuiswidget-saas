import { NextResponse } from "next/server";
import { ensureDemoCompany, getCompanyById } from "@/lib/companies";
import { isDemoCompany } from "@/lib/demo";
import { analyzePhotos, type PhotoInput } from "@/lib/gemini";
import { CORS, checkDemoRateLimit, clientIp, jsonResponse as json } from "@/lib/widget-request";
import type { InventoryItem } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PHOTOS = 14;
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * Analyseert de foto's en geeft de herkende inboedel terug, gegroepeerd per kamer.
 * Slaat geen lead op en verstuurt geen e-mail — dat gebeurt pas bij /api/widget/submit.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Ongeldige aanvraag." }, 400);
  }

  const companyId = form.get("companyId");
  if (typeof companyId !== "string") {
    return json({ error: "companyId ontbreekt." }, 400);
  }

  const demo = isDemoCompany(companyId);
  const company = demo ? await ensureDemoCompany() : await getCompanyById(companyId);
  if (!company) return json({ error: "Onbekende verhuizer." }, 404);

  const files = form.getAll("photos").filter((f): f is File => f instanceof File);
  const urls = form.getAll("photoUrls").map((u) => String(u));
  const rooms = form.getAll("photoRooms").map((r) => String(r));
  const count = files.length + urls.length;
  if (count === 0) return json({ error: "Upload minstens één foto." }, 400);
  if (count > MAX_PHOTOS) return json({ error: `Maximaal ${MAX_PHOTOS} foto's.` }, 400);

  const photos: PhotoInput[] = [];

  // Bestanden (demo/preview) — direct in de request.
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.size > MAX_PHOTO_BYTES) return json({ error: `Foto ${i + 1} is te groot.` }, 400);
    if (!file.type.startsWith("image/")) return json({ error: `Bestand ${i + 1} is geen afbeelding.` }, 400);
    const buffer = Buffer.from(await file.arrayBuffer());
    photos.push({
      data: buffer.toString("base64"),
      mimeType: file.type,
      room: rooms[i] ?? "Onbekende kamer",
    });
  }

  // Blob-URL's (echte aanvraag) — server-side ophalen voor Gemini.
  for (let i = 0; i < urls.length; i++) {
    try {
      const r = await fetch(urls[i], { signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;
      const buffer = Buffer.from(await r.arrayBuffer());
      if (buffer.byteLength > MAX_PHOTO_BYTES) continue;
      photos.push({
        data: buffer.toString("base64"),
        mimeType: r.headers.get("content-type") ?? "image/jpeg",
        room: rooms[files.length + i] ?? "Onbekende kamer",
      });
    } catch {
      // foto niet op te halen — overslaan
    }
  }

  if (photos.length === 0) return json({ error: "Geen foto's ontvangen." }, 400);

  if (demo) {
    const limitError = checkDemoRateLimit(clientIp(request));
    if (limitError) return json({ error: limitError }, 429);
  }

  let inventory: InventoryItem[];
  try {
    inventory = await analyzePhotos(photos);
  } catch (err) {
    console.error("Gemini-analyse mislukt:", err);
    return json({ error: "De foto-analyse is mislukt. Probeer het later opnieuw." }, 502);
  }

  // Gemini overschat regelmatig het aantal verhuisdozen — begrens per regel.
  const BOX_RE = /verhuisdo|dozen|\bdoos\b|verhuisdoos/i;
  for (const item of inventory) {
    if (BOX_RE.test(item.name)) item.quantity = Math.min(item.quantity, 10);
  }

  if (inventory.length === 0) {
    return json(
      { error: "Er zijn geen meubels herkend op de foto's. Probeer duidelijkere foto's." },
      422,
    );
  }

  // Kamers uit de foto's (op volgorde van eerste voorkomen).
  const photoRoomCounts = new Map<string, number>();
  for (const r of photos.map((p) => p.room)) {
    photoRoomCounts.set(r, (photoRoomCounts.get(r) ?? 0) + 1);
  }
  const knownRooms = [...photoRoomCounts.keys()];

  // Elk item aan een bekende kamer koppelen (fallback: eerste kamer).
  const withRoom = inventory.map((item) => ({
    ...item,
    room: item.room && knownRooms.includes(item.room) ? item.room : knownRooms[0],
  }));

  const roomGroups = knownRooms.map((name) => ({
    name,
    photoCount: photoRoomCounts.get(name) ?? 0,
    items: withRoom.filter((it) => it.room === name),
  }));

  return json({ ok: true, demo, rooms: roomGroups });
}
