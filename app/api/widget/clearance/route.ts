import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureDemoCompany, getCompanyById } from "@/lib/companies";
import { isDemoCompany } from "@/lib/demo";
import { createLead } from "@/lib/leads";
import { calculatePrice, clearanceTariffs, floorTypeRate, isRushDate } from "@/lib/pricing";
import { sendQuoteEmails } from "@/lib/email";
import {
  CORS,
  checkDemoRateLimit,
  clientIp,
  jsonResponse as json,
} from "@/lib/widget-request";
import type { InventoryItem, PriceLine } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  details: z.object({
    address: z.string().trim().max(200).optional().or(z.literal("")),
    propertyType: z.string().trim().max(60).optional().or(z.literal("")),
    floor: z.coerce.number().int().min(0).max(50).default(0),
    roomCount: z.coerce.number().int().min(0).max(50).default(0),
    hasElevator: z.boolean().default(false),
    streetAccessible: z.boolean().default(true),
    moveDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  }),
  works: z.object({
    floorRemoval: z
      .object({
        type: z.string().trim().max(40),
        m2: z.coerce.number().min(0).max(100000),
      })
      .nullable()
      .default(null),
    wallpaperM2: z.coerce.number().min(0).max(100000).default(0),
    holes: z.coerce.number().int().min(0).max(100000).default(0),
    paintingM2: z.coerce.number().min(0).max(100000).default(0),
    curtains: z.boolean().default(false),
    packing: z.boolean().default(false),
  }),
  photoRooms: z.array(z.string().trim().max(60)).max(60).default([]),
  photoUrls: z.array(z.url().max(500)).max(20).default([]),
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
    .min(1)
    .max(200),
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

  const preview = form.get("preview") === "1";
  const isDemo = isDemoCompany(parsed.companyId);
  const demo = isDemo || preview;
  const company = isDemo
    ? await ensureDemoCompany()
    : await getCompanyById(parsed.companyId);
  if (!company) return json({ error: "Onbekende verhuizer." }, 404);
  if (company.serviceType === "verhuizen") {
    return json({ error: "Dit bedrijf doet geen ontruimingen." }, 400);
  }

  if (demo) {
    const limitError = checkDemoRateLimit(clientIp(request));
    if (limitError) return json({ error: limitError }, 429);
  }

  const inventory: InventoryItem[] = parsed.inventory.map((it) => ({
    name: it.name,
    quantity: it.quantity,
    volumeM3: it.volumeM3,
    category: it.category,
    room: it.room,
  }));

  const w = parsed.works;

  // Basisprijs: net als verhuizen — inboedelvolume (m³) + verdieping + inpakken.
  // Met een gebouwlift vervalt de verdieping-toeslag.
  const base = calculatePrice(company, {
    inventory,
    distanceKm: 0,
    options: { packing: w.packing, assembly: false, storageMonths: 0 },
    fromFloor: parsed.details.floor,
    hasElevator: parsed.details.hasElevator,
    streetAccessible: parsed.details.streetAccessible,
    rush: isRushDate(parsed.details.moveDate),
  });

  // Extra werkzaamheden op m²/aantal.
  const t = clearanceTariffs(company);
  const extraLines: PriceLine[] = [];

  // Afvoer & transport: rit(ten) naar de milieustraat incl. stortkosten.
  if (t.haulPerTripCents > 0)
    extraLines.push({
      label:
        base.trips > 1
          ? `Afvoer & transport (${base.trips} ritten)`
          : "Afvoer & transport",
      amountCents: base.trips * t.haulPerTripCents,
    });

  if (w.floorRemoval && w.floorRemoval.m2 > 0)
    extraLines.push({
      label: `Vloer verwijderen (${w.floorRemoval.m2} m²)`,
      amountCents: Math.round(w.floorRemoval.m2 * floorTypeRate(t, w.floorRemoval.type)),
    });
  if (w.wallpaperM2 > 0)
    extraLines.push({
      label: `Behang verwijderen (${w.wallpaperM2} m²)`,
      amountCents: Math.round(w.wallpaperM2 * t.wallpaperPerM2Cents),
    });
  if (w.holes > 0)
    extraLines.push({
      label: `Gaatjes stoppen (${w.holes}×)`,
      amountCents: Math.round(w.holes * t.holesPerUnitCents),
    });
  if (w.paintingM2 > 0)
    extraLines.push({
      label: `Schilderwerk (${w.paintingM2} m²)`,
      amountCents: Math.round(w.paintingM2 * t.paintPerM2Cents),
    });
  if (w.curtains)
    extraLines.push({ label: "Gordijnen verwijderen", amountCents: t.curtainsCents });

  const breakdown = [
    ...base.breakdown.filter((l) => l.label !== "Btw"),
    ...extraLines,
  ];
  const subtotalCents = breakdown.reduce((s, l) => s + l.amountCents, 0);
  const vatCents = Math.round(subtotalCents * Number(company.vatRate));
  const totalCents = subtotalCents + vatCents;

  const rooms = [...new Set(parsed.photoRooms)].map((name) => ({
    name,
    photoCount: parsed.photoRooms.filter((r) => r === name).length,
  }));

  const responseBody = {
    ok: true,
    demo,
    inventory,
    rooms,
    totalVolumeM3: base.totalVolumeM3,
    breakdown,
    subtotalCents,
    vatCents,
    totalCents,
    emailSent: false,
  };

  const worksLines: string[] = [];
  if (w.floorRemoval) worksLines.push(`Vloer verwijderen (${w.floorRemoval.type}) — ${w.floorRemoval.m2} m²`);
  if (w.wallpaperM2 > 0) worksLines.push(`Behang — ${w.wallpaperM2} m²`);
  if (w.holes > 0) worksLines.push(`Gaatjes — ${w.holes} stuks`);
  if (w.paintingM2 > 0) worksLines.push(`Schilderwerk — ${w.paintingM2} m²`);
  if (w.curtains) worksLines.push("Gordijnen verwijderen");
  if (w.packing) worksLines.push("Inpakservice");

  const emailData = {
    company,
    customer: parsed.customer,
    move: { type: "ontruiming" as const, fromAddress: parsed.details.address, distanceKm: 0 },
    inventory,
    photoUrls: parsed.photoUrls,
    details: {
      Woningtype: parsed.details.propertyType || "",
      "Aantal kamers": parsed.details.roomCount ? String(parsed.details.roomCount) : "",
      Etage: String(parsed.details.floor),
      "Lift aanwezig": parsed.details.hasElevator ? "Ja" : "Nee",
      "Bereikbaar voor de wagen": parsed.details.streetAccessible ? "Ja" : "Nee",
      "Geschat aantal ritten": String(base.trips),
      Werkzaamheden: worksLines.join(" · "),
    },
    totalVolumeM3: base.totalVolumeM3,
    breakdown,
    subtotalCents,
    vatCents,
    totalCents,
    leadId: "demo",
  };

  if (demo) {
    const fake =
      preview || /@(voorbeeld\.nl|example\.(com|nl|org)|test\.)/i.test(parsed.customer.email);
    const sent = fake ? { sent: false as const } : await sendQuoteEmails(emailData, { customerOnly: true });
    return json({ ...responseBody, emailSent: sent.sent });
  }

  const lead = await createLead({
    companyId: company.id,
    customerName: parsed.customer.name,
    customerEmail: parsed.customer.email,
    customerPhone: parsed.customer.phone || null,
    moveType: "ontruiming",
    fromAddress: parsed.details.address || null,
    fromFloor: String(parsed.details.floor),
    moveDate: parsed.details.moveDate || null,
    rooms,
    inventory,
    photoUrls: parsed.photoUrls,
    totalVolumeM3: String(base.totalVolumeM3),
    clearance: {
      propertyType: parsed.details.propertyType || "",
      roomCount: parsed.details.roomCount,
      hasElevator: parsed.details.hasElevator,
      streetAccessible: parsed.details.streetAccessible,
      works: parsed.works,
    },
    priceBreakdown: breakdown,
    subtotalCents,
    vatCents,
    totalCents,
  });

  const emailResult = await sendQuoteEmails({ ...emailData, leadId: lead.id });

  return json({ ...responseBody, emailSent: emailResult.sent });
}
