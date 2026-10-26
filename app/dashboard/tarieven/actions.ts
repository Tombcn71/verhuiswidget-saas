"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminCompany } from "@/lib/current-company";
import {
  updateCompanySettings,
  normalizeServiceType,
  type CompanySettingsInput,
} from "@/lib/companies";
import {
  CLEARANCE_TARIFF_DEFAULTS,
  type ClearanceTariffs,
} from "@/lib/db/schema";

const num = (max: number) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      const n = Number(v.replace(",", "."));
      if (!Number.isFinite(n) || n < 0 || n > max) {
        ctx.addIssue({ code: "custom", message: "Ongeldige waarde" });
        return z.NEVER;
      }
      return n;
    })
    .optional();

const euros = num(100000);

const schema = z.object({
  // Basis (gedeeld door verhuizen en ontruimen)
  baseFee: euros,
  pricingMode: z.enum(["uur", "m3"]).optional(),
  pricePerM3: euros,
  pricePerKm: euros,
  hourlyRatePerMover: euros,
  tempoM3: num(500),
  tempoHours: num(48),
  tempoMovers: num(8),
  crewTwoMaxM3: num(500),
  crewThreeMaxM3: num(500),
  vanRate: euros,
  vanRateUnit: z.enum(["uur", "dag", "rit"]).optional(),
  travelMode: z.enum(["rit", "loods", "geen"]).optional(),
  minHours: num(12),
  roundingMinutes: z.enum(["15", "30", "60"]).optional(),
  saturdaySurchargePct: num(200),
  sundaySurchargePct: num(200),
  stairMinutesPerFloor: num(240),
  truckCapacityM3: num(120),
  packingFee: euros,
  assemblyFee: euros,
  boxPrice: euros,
  storagePerMonth: euros,
  minPrice: euros,
  moveFloorSurcharge: euros,
  liftFee: euros,
  truckAccess: euros,
  rushSurcharge: euros,
  // Ontruimen — extra werkzaamheden
  clWallpaper: euros,
  clHoles: euros,
  clPaint: euros,
  clCurtains: euros,
  clHaul: euros,
  clFloorLaminaat: euros,
  clFloorTapijt: euros,
  clFloorPvcClick: euros,
  clFloorKurk: euros,
  clFloorPvcGelijmd: euros,
  clFloorParketGelijmd: euros,
  clFloorTegelvloer: euros,
});

export type TariffFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string>;
};

const toCents = (n: number) => Math.round(n * 100);

export async function updateTariffs(
  _prev: TariffFormState,
  formData: FormData,
): Promise<TariffFormState> {
  const company = await requireAdminCompany();
  const serviceType = normalizeServiceType(company.serviceType);

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[String(issue.path[0])] = issue.message;
    }
    return { status: "error", message: "Controleer de gemarkeerde velden.", errors };
  }
  const d = parsed.data;

  // Tempo en ploeg moeten kloppen, anders kan de app geen uren uitrekenen.
  if (d.baseFee !== undefined && (d.pricingMode ?? "uur") === "uur") {
    const errors: Record<string, string> = {};
    if (!d.tempoM3) errors.tempoM3 = "Vul het aantal m³ in";
    if (!d.tempoHours) errors.tempoHours = "Vul het aantal uur in";
    if (!d.tempoMovers || !Number.isInteger(d.tempoMovers)) errors.tempoMovers = "Vul een heel aantal man in";
    if (!d.crewTwoMaxM3 || !d.crewThreeMaxM3 || d.crewThreeMaxM3 <= d.crewTwoMaxM3)
      errors.crewThreeMaxM3 = "De grens voor 3 man moet hoger zijn dan die voor 2 man";
    if (Object.keys(errors).length > 0)
      return { status: "error", message: "Controleer de gemarkeerde velden.", errors };
  }

  const update: CompanySettingsInput = {};

  if (d.baseFee !== undefined) {
    update.baseFeeCents = toCents(d.baseFee);
    update.pricingMode = d.pricingMode ?? "uur";
    update.pricePerM3Cents = toCents(d.pricePerM3 ?? 0);
    update.pricePerKmCents = toCents(d.pricePerKm ?? 0);
    update.hourlyRatePerMoverCents = toCents(d.hourlyRatePerMover ?? 0);
    if (d.tempoM3 && d.tempoHours && d.tempoMovers) {
      update.tempoM3 = String(d.tempoM3);
      update.tempoHours = String(d.tempoHours);
      update.tempoMovers = Math.round(d.tempoMovers);
      // Afgeleid, voor oudere code die nog m³ per man per uur leest.
      const speed = d.tempoM3 / (d.tempoHours * d.tempoMovers);
      update.m3PerHourPerMover = String(Math.min(99, Math.round(speed * 10) / 10));
    }
    if (d.crewTwoMaxM3 && d.crewThreeMaxM3) {
      update.crewTwoMaxM3 = Math.round(d.crewTwoMaxM3);
      update.crewThreeMaxM3 = Math.round(d.crewThreeMaxM3);
    }
    update.vanRateCents = toCents(d.vanRate ?? 0);
    update.vanRateUnit = d.vanRateUnit ?? "uur";
    update.travelMode = d.travelMode ?? "rit";
    update.minHours = String(d.minHours ?? 0);
    update.roundingMinutes = Number(d.roundingMinutes ?? 30);
    update.saturdaySurchargePct = Math.round(d.saturdaySurchargePct ?? 0);
    update.sundaySurchargePct = Math.round(d.sundaySurchargePct ?? 0);
    update.stairMinutesPerFloor = Math.round(d.stairMinutesPerFloor ?? 45);
    update.truckCapacityM3 = Math.round(d.truckCapacityM3 ?? 40);
    update.packingFeeCents = toCents(d.packingFee ?? 0);
    update.assemblyFeeCents = toCents(d.assemblyFee ?? 0);
    update.boxPriceCents = toCents(d.boxPrice ?? 0);
    update.storagePerMonthCents = toCents(d.storagePerMonth ?? 0);
    update.minPriceCents = toCents(d.minPrice ?? 0);
    update.moveFloorSurchargeCents = toCents(d.moveFloorSurcharge ?? 0);
    update.liftFeeCents = toCents(d.liftFee ?? 0);
    update.truckAccessSurchargeCents = toCents(d.truckAccess ?? 0);
    update.rushSurchargeCents = toCents(d.rushSurcharge ?? 0);
  }

  if (serviceType !== "verhuizen" && d.clWallpaper !== undefined) {
    const c = CLEARANCE_TARIFF_DEFAULTS;
    const tariffs: ClearanceTariffs = {
      wallpaperPerM2Cents: toCents(d.clWallpaper ?? 0),
      holesPerUnitCents: toCents(d.clHoles ?? 0),
      paintPerM2Cents: toCents(d.clPaint ?? 0),
      curtainsCents: toCents(d.clCurtains ?? 0),
      haulPerTripCents: toCents(d.clHaul ?? c.haulPerTripCents / 100),
      floorLaminaatCents: toCents(d.clFloorLaminaat ?? c.floorLaminaatCents / 100),
      floorTapijtCents: toCents(d.clFloorTapijt ?? c.floorTapijtCents / 100),
      floorPvcClickCents: toCents(d.clFloorPvcClick ?? c.floorPvcClickCents / 100),
      floorKurkCents: toCents(d.clFloorKurk ?? c.floorKurkCents / 100),
      floorPvcGelijmdCents: toCents(d.clFloorPvcGelijmd ?? c.floorPvcGelijmdCents / 100),
      floorParketGelijmdCents: toCents(d.clFloorParketGelijmd ?? c.floorParketGelijmdCents / 100),
      floorTegelvloerCents: toCents(d.clFloorTegelvloer ?? c.floorTegelvloerCents / 100),
    };
    update.ontruimenTariffs = tariffs;
  }

  await updateCompanySettings(company.id, update);

  revalidatePath("/dashboard/tarieven");
  revalidatePath("/dashboard");
  return { status: "success", message: "Tarieven opgeslagen." };
}
