import { NextResponse } from "next/server";
import { notifyIfOverScanLimit } from "@/lib/scan-alerts";
import { isAdminEmail } from "@/lib/admin";
import { z } from "zod";
import { isValidPhone } from "@/lib/phone";
import { ensureDemoCompany, getCompanyById } from "@/lib/companies";
import { hasAccess } from "@/lib/plans";
import { demoBookingUrl, isDemoCompany } from "@/lib/demo";
import { recordDemoLead } from "@/lib/demo-leads";
import { demoMeetingUrl, handleDemoCompleted } from "@/lib/prospect-mails";
import { appUrl } from "@/lib/app-url";
import { bookingUrl, createLead } from "@/lib/leads";
import { analyzePhotos, type PhotoInput } from "@/lib/gemini";
import { calculatePrice, isRushDate } from "@/lib/pricing";
import { approachKm } from "@/lib/route";
import { sendQuoteEmails } from "@/lib/email";
import {
  CORS,
  checkDemoRateLimit,
  clientIp,
  futureDate,
  geoPoint,
  jsonResponse as json,
} from "@/lib/widget-request";
import type { InventoryItem } from "@/lib/db/schema";
import { SAMPLE_HOMES } from "@/app/widget/[companyId]/sample-homes";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PHOTOS = 14;
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const payloadSchema = z.object({
  companyId: z.uuid(),
  // Alleen een label voor de verhuizer (niet geverifieerd): widget, link of zelf gescand.
  source: z.enum(["onsite", "onlink", "onspot"]).default("onsite"),
  // Alleen in de demo: slug van de prospect (persoonlijke demolink in de verkoop-CRM).
  prospect: z.string().trim().max(60).optional(),
  // Alleen in de demo: gekozen voorbeeldwoning, voor de foto's in de verhuizersmail.
  sampleHome: z.string().trim().max(40).optional(),
  moveType: z.enum(["verhuizing", "ontruiming"]).default("verhuizing"),
  customer: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.email(),
    phone: z
      .string()
      .trim()
      .max(40)
      .refine((p) => isValidPhone(p), "Vul een geldig telefoonnummer in."),
  }),
  move: z.object({
    fromAddress: z.string().trim().max(200).optional().or(z.literal("")),
    toAddress: z.string().trim().max(200).optional().or(z.literal("")),
    fromFloor: z.string().trim().max(40).optional().or(z.literal("")),
    toFloor: z.string().trim().max(40).optional().or(z.literal("")),
    propertyType: z.string().trim().max(40).optional().or(z.literal("")),
    roomCount: z.coerce.number().int().min(0).max(50).default(0),
    hasElevator: z.boolean().default(false),
    streetAccessible: z.boolean().default(true),
    moveDate: futureDate,
    distanceKm: z.coerce.number().min(0).max(5000).default(0),
    // Coördinaten van de gevonden adressen (PDOK), voor de aanrijroute.
    fromPoint: geoPoint,
    toPoint: geoPoint,
  }),
  options: z.object({
    packing: z.boolean().default(false),
    assembly: z.boolean().default(false),
    boxes: z.boolean().default(false),
    storageMonths: z.coerce.number().int().min(0).max(36).default(0),
  }),
  photoRooms: z.array(z.string().trim().max(60)).max(MAX_PHOTOS),
  photoUrls: z.array(z.url().max(500)).max(MAX_PHOTOS).default([]),
  // Al door de klant nagekeken inventaris (uit /api/widget/analyze). Als dit
  // meekomt slaat de submit de foto-analyse over.
  inventory: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        quantity: z.coerce.number().int().min(1).max(99),
        volumeM3: z.coerce.number().min(0).max(50),
        category: z.string().trim().max(40).default("overig"),
        room: z.string().trim().max(60).optional(),
      }),
    )
    .max(200)
    .optional(),
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

  const preview = form.get("preview") === "1";
  const isDemo = isDemoCompany(parsed.companyId);
  const demo = isDemo || preview; // demo én preview: geen lead, geen bedrijfsmail
  const company = isDemo
    ? await ensureDemoCompany()
    : await getCompanyById(parsed.companyId);
  if (!company) {
    return json({ error: "Onbekende verhuizer." }, 404);
  }

  const preAnalyzed = parsed.inventory && parsed.inventory.length > 0;

  const files = form.getAll("photos").filter((f): f is File => f instanceof File);
  if (files.length === 0 && !preAnalyzed) {
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

  // Kamers samenvatten — uit de foto's, of anders uit de nagekeken inventaris.
  const roomCounts = new Map<string, number>();
  for (const room of parsed.photoRooms.slice(0, Math.max(photos.length, parsed.photoRooms.length))) {
    roomCounts.set(room, (roomCounts.get(room) ?? 0) + 1);
  }
  const rooms = [...roomCounts.entries()].map(([name, photoCount]) => ({ name, photoCount }));

  // Demo: rate-limiten vlak vóór de (betaalde) Gemini-call.
  if (demo && !preAnalyzed) {
    const limitError = checkDemoRateLimit(clientIp(request));
    if (limitError) return json({ error: limitError }, 429);
  }

  // 1. Inventaris: nagekeken lijst van de klant, of anders alsnog een foto-analyse.
  let inventory: InventoryItem[];
  if (preAnalyzed) {
    inventory = parsed.inventory!.map((it) => ({
      name: it.name,
      quantity: it.quantity,
      volumeM3: it.volumeM3,
      category: it.category,
      room: it.room,
    }));
  } else {
    try {
      inventory = await analyzePhotos(photos);
    } catch (err) {
      console.error("Gemini-analyse mislukt:", err);
      return json(
        { error: "De foto-analyse is mislukt. Probeer het later opnieuw." },
        502,
      );
    }
  }
  if (inventory.length === 0) {
    return json(
      { error: "Er zijn geen meubels herkend op de foto's. Probeer duidelijkere foto's." },
      422,
    );
  }

  // 2. Afstand: zoals de klant 'm zag (berekend of zelf ingevuld). Plus aan- en
  //    afrijden: vestiging → ophaaladres, en bezorgadres → vestiging.
  const distanceKm = parsed.move.distanceKm;
  const approach = await approachKm(company, parsed.move.fromPoint, parsed.move.toPoint);

  // 3. Prijsberekening met de tarieven van deze verhuizer
  const price = calculatePrice(company, {
    inventory,
    distanceKm,
    approachKm: approach,
    options: parsed.options,
    fromFloor: Number(parsed.move.fromFloor) || 0,
    toFloor: Number(parsed.move.toFloor) || 0,
    hasElevator: parsed.move.hasElevator,
    streetAccessible: parsed.move.streetAccessible,
    rush: isRushDate(parsed.move.moveDate),
    moveDate: parsed.move.moveDate,
  });

  const extras = [
    parsed.options.packing && "Inpakservice",
    parsed.options.assembly && "Meubelmontage en -demontage",
    parsed.options.boxes && "Verhuisdozen laten bezorgen",
    parsed.options.storageMonths > 0 &&
      `Opslag (${parsed.options.storageMonths} ${parsed.options.storageMonths === 1 ? "maand" : "maanden"})`,
  ].filter((x): x is string => !!x);
  const details = {
    Woningtype: parsed.move.propertyType || "",
    "Aantal kamers": parsed.move.roomCount ? String(parsed.move.roomCount) : "",
    Etage: parsed.move.fromFloor || "",
    "Lift aanwezig": parsed.move.hasElevator ? "Ja" : "Nee",
    "Bereikbaar voor de wagen": parsed.move.streetAccessible ? "Ja" : "Nee",
  };

  // Demo: geen lead opslaan, maar wél de offerte mailen (behalve naar de
  // niet-bestaande voorbeeld-adressen). De bezoeker is een verhuizer, dus hij
  // krijgt beide mails: die van zijn klant en die van hemzelf.
  if (demo) {
    const fake =
      preview || /@(voorbeeld\.nl|example\.(com|nl|org)|test\.)/i.test(parsed.customer.email);
    // Persoonlijke demolink: in de verkoop-CRM op "Demo gedaan" zetten.
    if (isDemo && !preview && parsed.prospect) await handleDemoCompleted(parsed.prospect);
    // Demo met echt e-mailadres: verhuizer-lead voor moverAI (/admin). Niet als
    // een beheerder zelf test, anders krijg je een seintje over jezelf.
    const demoLead =
      isDemo && !fake && !isAdminEmail(parsed.customer.email)
        ? await recordDemoLead({
            name: parsed.customer.name,
            email: parsed.customer.email,
            phone: parsed.customer.phone,
            moveType: parsed.moveType,
            totalCents: price.totalCents,
          })
        : null;
    // Voorbeeldwoning: de foto's staan publiek op de site, dus die kunnen in de mail.
    const sample = SAMPLE_HOMES.find((h) => h.id === parsed.sampleHome);
    const samplePhotoUrls = sample
      ? sample.photos.map((p) => `${appUrl()}/voorbeeldwoningen/${sample.id}/${p.file}.jpg`)
      : [];
    const demoEmail = fake
      ? { sent: false as const }
      : await sendQuoteEmails(
          {
            company,
            customer: parsed.customer,
            move: { type: parsed.moveType, ...parsed.move },
            inventory,
            photoUrls: samplePhotoUrls,
            details,
            planning: price.planning,
            extras,
            totalVolumeM3: price.totalVolumeM3,
            breakdown: price.breakdown,
            subtotalCents: price.subtotalCents,
            vatCents: price.vatCents,
            totalCents: price.totalCents,
            leadId: "demo",
            // Demo-boekingslink (niets opgeslagen) zodat de knop ook in de demo-mail staat.
            acceptUrl: demoBookingUrl(appUrl(), {
              name: parsed.customer.name,
              totalCents: price.totalCents,
              moveDate: parsed.move.moveDate,
              moveType: parsed.moveType,
              fromAddress: parsed.move.fromAddress,
              toAddress: parsed.move.toAddress,
              volumeM3: price.totalVolumeM3,
              demoLeadId: demoLead?.id,
              prospect: parsed.prospect,
            }),
          },
          // Test je tarieven (preview) mailt nooit; alleen de echte demo.
          { demo: true, meetingUrl: demoMeetingUrl(parsed.prospect) },
        );
    return json({
      ok: true,
      demo: true,
      inventory,
      rooms,
      totalVolumeM3: price.totalVolumeM3,
      planning: price.planning,
      breakdown: price.breakdown,
      subtotalCents: price.subtotalCents,
      vatCents: price.vatCents,
      totalCents: price.totalCents,
      emailSent: demoEmail.sent,
    });
  }

  // 3. Lead opslaan
  const lead = await createLead({
    companyId: company.id,
    source: parsed.source,
    customerName: parsed.customer.name,
    customerEmail: parsed.customer.email,
    customerPhone: parsed.customer.phone || null,
    moveType: parsed.moveType,
    fromAddress: parsed.move.fromAddress || null,
    toAddress: parsed.move.toAddress || null,
    fromFloor: parsed.move.fromFloor || null,
    toFloor: parsed.move.toFloor || null,
    moveDate: parsed.move.moveDate || null,
    distanceKm: String(distanceKm),
    rooms,
    inventory,
    photoUrls: parsed.photoUrls,
    totalVolumeM3: String(price.totalVolumeM3),
    options: parsed.options,
    move: {
      propertyType: parsed.move.propertyType || undefined,
      roomCount: parsed.move.roomCount || undefined,
      hasElevator: parsed.move.hasElevator,
      streetAccessible: parsed.move.streetAccessible,
    },
    priceBreakdown: price.breakdown,
    subtotalCents: price.subtotalCents,
    vatCents: price.vatCents,
    totalCents: price.totalCents,
  });
  // Voor het eerst deze maand over de scans: seintje aan moverAI (niet fataal).
  await notifyIfOverScanLimit(company).catch(() => {});

  // 4. Offerte-e-mails versturen (niet fataal). Proef verlopen zonder betaling:
  // alleen de klant krijgt z'n offerte; het bedrijf ziet de lead na activeren.
  const emailResult = await sendQuoteEmails(
    {
      company,
      customer: parsed.customer,
      move: { type: parsed.moveType, ...parsed.move, distanceKm },
      inventory,
      photoUrls: parsed.photoUrls,
      details,
      planning: price.planning,
      extras,
      totalVolumeM3: price.totalVolumeM3,
      breakdown: price.breakdown,
      subtotalCents: price.subtotalCents,
      vatCents: price.vatCents,
      totalCents: price.totalCents,
      leadId: lead.id,
      acceptUrl: bookingUrl(lead),
    },
    { customerOnly: !hasAccess(company) },
  );

  return json({
    ok: true,
    inventory,
    rooms,
    totalVolumeM3: price.totalVolumeM3,
    planning: price.planning,
    breakdown: price.breakdown,
    subtotalCents: price.subtotalCents,
    vatCents: price.vatCents,
    totalCents: price.totalCents,
    emailSent: emailResult.sent,
    acceptUrl: bookingUrl(lead),
  });
}
