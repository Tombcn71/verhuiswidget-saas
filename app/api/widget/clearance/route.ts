import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureDemoCompany, getCompanyById } from "@/lib/companies";
import { isDemoCompany } from "@/lib/demo";
import { createLead } from "@/lib/leads";
import { analyzeClearance, type PhotoInput } from "@/lib/gemini";
import { calculateClearancePrice, clearanceTariffs } from "@/lib/pricing";
import { sendQuoteEmails } from "@/lib/email";
import {
  CORS,
  checkDemoRateLimit,
  clientIp,
  jsonResponse as json,
} from "@/lib/widget-request";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const payloadSchema = z.object({
  companyId: z.uuid(),
  customer: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.email(),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
  }),
  postcode: z.string().trim().max(12).optional().or(z.literal("")),
  propertyType: z.string().trim().max(60).optional().or(z.literal("")),
  areaM2: z.coerce.number().min(1).max(10000),
  floor: z.coerce.number().int().min(0).max(50).default(0),
  hasLift: z.boolean().default(false),
  works: z.object({
    floorRemoval: z.boolean().default(false),
    wallpaper: z.boolean().default(false),
    holes: z.boolean().default(false),
    painting: z.boolean().default(false),
    curtains: z.boolean().default(false),
  }),
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
      err instanceof z.ZodError
        ? err.issues.map((i) => i.message).join(", ")
        : "Ongeldige payload.";
    return json({ error: message }, 400);
  }

  const demo = isDemoCompany(parsed.companyId);
  const company = demo
    ? await ensureDemoCompany()
    : await getCompanyById(parsed.companyId);
  if (!company) return json({ error: "Onbekende verhuizer." }, 404);
  if (company.serviceType === "verhuizen") {
    return json({ error: "Dit bedrijf doet geen ontruimingen." }, 400);
  }

  const files = form.getAll("photos").filter((f): f is File => f instanceof File);
  if (files.length === 0) return json({ error: "Upload minstens één foto." }, 400);
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
      room: "woning",
    });
  }

  if (demo) {
    const limitError = checkDemoRateLimit(clientIp(request));
    if (limitError) return json({ error: limitError }, 429);
  }

  let analysis;
  try {
    analysis = await analyzeClearance(photos);
  } catch (err) {
    console.error("Ontruimings-analyse mislukt:", err);
    return json(
      { error: "De foto-analyse is mislukt. Probeer het later opnieuw." },
      502,
    );
  }

  const price = calculateClearancePrice(clearanceTariffs(company), {
    areaM2: parsed.areaM2,
    floor: parsed.floor,
    hasLift: parsed.hasLift,
    fillLevel: analysis.fillLevel,
    works: parsed.works,
    vatRate: company.vatRate,
  });

  const clearancePayload = {
    postcode: parsed.postcode || "",
    propertyType: parsed.propertyType || "",
    areaM2: parsed.areaM2,
    floor: parsed.floor,
    hasLift: parsed.hasLift,
    works: parsed.works,
    fillLevel: analysis.fillLevel,
    items: analysis.items,
    estimatedBoxes: analysis.estimatedBoxes,
    specialItems: analysis.specialItems,
  };

  const responseBody = {
    ok: true,
    demo,
    fillLevel: analysis.fillLevel,
    items: analysis.items,
    estimatedBoxes: analysis.estimatedBoxes,
    specialItems: analysis.specialItems,
    breakdown: price.breakdown,
    subtotalCents: price.subtotalCents,
    vatCents: price.vatCents,
    totalCents: price.totalCents,
    emailSent: false,
  };

  if (demo) return json(responseBody);

  const lead = await createLead({
    companyId: company.id,
    customerName: parsed.customer.name,
    customerEmail: parsed.customer.email,
    customerPhone: parsed.customer.phone || null,
    moveType: "ontruiming",
    fromAddress: parsed.postcode || null,
    inventory: analysis.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      volumeM3: 0,
      category: i.size,
    })),
    totalVolumeM3: "0",
    clearance: clearancePayload,
    priceBreakdown: price.breakdown,
    subtotalCents: price.subtotalCents,
    vatCents: price.vatCents,
    totalCents: price.totalCents,
  });

  const emailResult = await sendQuoteEmails({
    company,
    customer: parsed.customer,
    move: { type: "ontruiming", distanceKm: 0 },
    inventory: [],
    totalVolumeM3: 0,
    breakdown: price.breakdown,
    subtotalCents: price.subtotalCents,
    vatCents: price.vatCents,
    totalCents: price.totalCents,
    leadId: lead.id,
    clearance: {
      postcode: clearancePayload.postcode,
      propertyType: clearancePayload.propertyType,
      areaM2: clearancePayload.areaM2,
      floor: clearancePayload.floor,
      fillLevel: analysis.fillLevel,
      estimatedBoxes: analysis.estimatedBoxes,
      specialItems: analysis.specialItems,
      items: analysis.items,
    },
  });

  return json({ ...responseBody, emailSent: emailResult.sent });
}
