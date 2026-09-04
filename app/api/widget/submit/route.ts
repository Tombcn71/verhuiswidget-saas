import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureDemoCompany, getCompanyById } from "@/lib/companies";
import { isDemoCompany } from "@/lib/demo";
import { createLead } from "@/lib/leads";
import { analyzePhotos, type PhotoInput } from "@/lib/gemini";
import { calculatePrice } from "@/lib/pricing";
import { sendQuoteEmails } from "@/lib/email";
import {
  CORS,
  checkDemoRateLimit,
  clientIp,
  jsonResponse as json,
} from "@/lib/widget-request";
import type { InventoryItem } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PHOTOS = 14;
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const payloadSchema = z.object({
  companyId: z.uuid(),
  moveType: z.enum(["verhuizing", "ontruiming"]).default("verhuizing"),
  customer: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.email(),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
  }),
  move: z.object({
    fromAddress: z.string().trim().max(200).optional().or(z.literal("")),
    toAddress: z.string().trim().max(200).optional().or(z.literal("")),
    fromFloor: z.string().trim().max(40).optional().or(z.literal("")),
    toFloor: z.string().trim().max(40).optional().or(z.literal("")),
    moveDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
    distanceKm: z.coerce.number().min(0).max(5000).default(0),
  }),
  options: z.object({
    packing: z.boolean().default(false),
    assembly: z.boolean().default(false),
    storageMonths: z.coerce.number().int().min(0).max(36).default(0),
  }),
  photoRooms: z.array(z.string().trim().max(60)).max(MAX_PHOTOS),
});

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Ongeldige aanvraag." }, 400);
  }

  const rawPayload = form.get("payload");
  if (typeof rawPayload !== "string") {
    return json({ error: "payload ontbreekt." }, 400);
  }

  let parsed;
  try {
    parsed = payloadSchema.parse(JSON.parse(rawPayload));
  } catch (err) {
    const message =
      err instanceof z.ZodError ? err.issues.map((i) => i.message).join(", ") : "Ongeldige payload.";
    return json({ error: message }, 400);
  }

  const demo = isDemoCompany(parsed.companyId);
  const company = demo
    ? await ensureDemoCompany()
    : await getCompanyById(parsed.companyId);
  if (!company) {
    return json({ error: "Onbekende verhuizer." }, 404);
  }

  const files = form.getAll("photos").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return json({ error: "Upload minstens één foto." }, 400);
  }
  if (files.length > MAX_PHOTOS) {
    return json({ error: `Maximaal ${MAX_PHOTOS} foto's.` }, 400);
  }

  const photos: PhotoInput[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.size > MAX_PHOTO_BYTES) {
      return json({ error: `Foto ${i + 1} is te groot.` }, 400);
    }
    if (!file.type.startsWith("image/")) {
      return json({ error: `Bestand ${i + 1} is geen afbeelding.` }, 400);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    photos.push({
      data: buffer.toString("base64"),
      mimeType: file.type,
      room: parsed.photoRooms[i] ?? "Onbekende kamer",
    });
  }

  // Kamers samenvatten
  const roomCounts = new Map<string, number>();
  for (const room of parsed.photoRooms.slice(0, photos.length)) {
    roomCounts.set(room, (roomCounts.get(room) ?? 0) + 1);
  }
  const rooms = [...roomCounts.entries()].map(([name, photoCount]) => ({ name, photoCount }));

  // Demo: rate-limiten vlak vóór de (betaalde) Gemini-call.
  if (demo) {
    const limitError = checkDemoRateLimit(clientIp(request));
    if (limitError) return json({ error: limitError }, 429);
  }

  // 1. Foto-analyse via Gemini
  let inventory: InventoryItem[];
  try {
    inventory = await analyzePhotos(photos);
  } catch (err) {
    console.error("Gemini-analyse mislukt:", err);
    return json(
      { error: "De foto-analyse is mislukt. Probeer het later opnieuw." },
      502,
    );
  }
  if (inventory.length === 0) {
    return json(
      { error: "Er zijn geen meubels herkend op de foto's. Probeer duidelijkere foto's." },
      422,
    );
  }

  // 2. Prijsberekening met de tarieven van deze verhuizer
  const price = calculatePrice(company, {
    inventory,
    distanceKm: parsed.move.distanceKm,
    options: parsed.options,
  });

  // Demo: stop hier — geen lead opslaan, geen e-mails versturen.
  if (demo) {
    return json({
      ok: true,
      demo: true,
      inventory,
      rooms,
      totalVolumeM3: price.totalVolumeM3,
      breakdown: price.breakdown,
      subtotalCents: price.subtotalCents,
      vatCents: price.vatCents,
      totalCents: price.totalCents,
      emailSent: false,
    });
  }

  // 3. Lead opslaan
  const lead = await createLead({
    companyId: company.id,
    customerName: parsed.customer.name,
    customerEmail: parsed.customer.email,
    customerPhone: parsed.customer.phone || null,
    moveType: parsed.moveType,
    fromAddress: parsed.move.fromAddress || null,
    toAddress: parsed.move.toAddress || null,
    fromFloor: parsed.move.fromFloor || null,
    toFloor: parsed.move.toFloor || null,
    moveDate: parsed.move.moveDate || null,
    distanceKm: String(parsed.move.distanceKm),
    rooms,
    inventory,
    totalVolumeM3: String(price.totalVolumeM3),
    options: parsed.options,
    priceBreakdown: price.breakdown,
    subtotalCents: price.subtotalCents,
    vatCents: price.vatCents,
    totalCents: price.totalCents,
  });

  // 4. Offerte-e-mails versturen (niet fataal)
  const emailResult = await sendQuoteEmails({
    company,
    customer: parsed.customer,
    move: { type: parsed.moveType, ...parsed.move },
    inventory,
    totalVolumeM3: price.totalVolumeM3,
    breakdown: price.breakdown,
    subtotalCents: price.subtotalCents,
    vatCents: price.vatCents,
    totalCents: price.totalCents,
    leadId: lead.id,
  });

  return json({
    ok: true,
    inventory,
    rooms,
    totalVolumeM3: price.totalVolumeM3,
    breakdown: price.breakdown,
    subtotalCents: price.subtotalCents,
    vatCents: price.vatCents,
    totalCents: price.totalCents,
    emailSent: emailResult.sent,
  });
}
