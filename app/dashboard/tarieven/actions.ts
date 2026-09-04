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
const pct = num(1000);

const schema = z.object({
  // Verhuizen (m³-model)
  baseFee: euros,
  pricePerM3: euros,
  pricePerKm: euros,
  packingFee: euros,
  assemblyFee: euros,
  storagePerMonth: euros,
  minPrice: euros,
  moveFloorSurcharge: euros,
  liftFee: euros,
  // Ontruimen (m²-model)
  clPricePerM2: euros,
  clFillMinimaal: pct,
  clFillNormaal: pct,
  clFillVol: pct,
  clFillOvervol: pct,
  clFloorSurcharge: euros,
  clNoLiftSurcharge: euros,
  clTransport: euros,
  clMinPrice: euros,
  clWallpaper: euros,
  clHoles: euros,
  clPaint: euros,
  clFloorRemoval: euros,
  clCurtains: euros,
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

  if (serviceType !== "ontruimen" && d.baseFee !== undefined) {
    update.baseFeeCents = toCents(d.baseFee);
    update.pricePerM3Cents = toCents(d.pricePerM3 ?? 0);
    update.pricePerKmCents = toCents(d.pricePerKm ?? 0);
    update.packingFeeCents = toCents(d.packingFee ?? 0);
    update.assemblyFeeCents = toCents(d.assemblyFee ?? 0);
    update.storagePerMonthCents = toCents(d.storagePerMonth ?? 0);
    update.minPriceCents = toCents(d.minPrice ?? 0);
    update.moveFloorSurchargeCents = toCents(d.moveFloorSurcharge ?? 0);
    update.liftFeeCents = toCents(d.liftFee ?? 0);
  }

  if (serviceType !== "verhuizen" && d.clPricePerM2 !== undefined) {
    const c = CLEARANCE_TARIFF_DEFAULTS;
    const tariffs: ClearanceTariffs = {
      pricePerM2Cents: toCents(d.clPricePerM2),
      fillFactorMinimaal: Math.round(d.clFillMinimaal ?? c.fillFactorMinimaal),
      fillFactorNormaal: Math.round(d.clFillNormaal ?? c.fillFactorNormaal),
      fillFactorVol: Math.round(d.clFillVol ?? c.fillFactorVol),
      fillFactorOvervol: Math.round(d.clFillOvervol ?? c.fillFactorOvervol),
      floorSurchargeCents: toCents(d.clFloorSurcharge ?? 0),
      noLiftSurchargeCents: toCents(d.clNoLiftSurcharge ?? 0),
      transportCents: toCents(d.clTransport ?? 0),
      minPriceCents: toCents(d.clMinPrice ?? 0),
      wallpaperPerM2Cents: toCents(d.clWallpaper ?? 0),
      holesPerM2Cents: toCents(d.clHoles ?? 0),
      paintPerM2Cents: toCents(d.clPaint ?? 0),
      floorRemovalPerM2Cents: toCents(d.clFloorRemoval ?? 0),
      curtainsCents: toCents(d.clCurtains ?? 0),
    };
    update.ontruimenTariffs = tariffs;
  }

  await updateCompanySettings(company.id, update);

  revalidatePath("/dashboard/tarieven");
  revalidatePath("/dashboard");
  return { status: "success", message: "Tarieven opgeslagen." };
}
