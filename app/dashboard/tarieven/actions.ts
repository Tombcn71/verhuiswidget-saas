"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCompany } from "@/lib/current-company";
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
  pricePerM3: euros,
  pricePerKm: euros,
  hourlyRatePerMover: euros,
  m3PerHourPerMover: num(20),
  truckCapacityM3: num(120),
  packingFee: euros,
  assemblyFee: euros,
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
  const company = await requireCompany();
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

  const update: CompanySettingsInput = {};

  if (d.baseFee !== undefined) {
    update.baseFeeCents = toCents(d.baseFee);
    update.pricePerM3Cents = toCents(d.pricePerM3 ?? 0);
    update.pricePerKmCents = toCents(d.pricePerKm ?? 0);
    update.hourlyRatePerMoverCents = toCents(d.hourlyRatePerMover ?? 0);
    update.m3PerHourPerMover = String(d.m3PerHourPerMover ?? 1.8);
    update.truckCapacityM3 = Math.round(d.truckCapacityM3 ?? 20);
    update.packingFeeCents = toCents(d.packingFee ?? 0);
    update.assemblyFeeCents = toCents(d.assemblyFee ?? 0);
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
