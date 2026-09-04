import {
  CLEARANCE_TARIFF_DEFAULTS,
  type ClearanceFill,
  type ClearanceTariffs,
  type ClearanceWorks,
  type Company,
  type InventoryItem,
  type LeadOptions,
  type PriceLine,
} from "@/lib/db/schema";

export type PriceResult = {
  breakdown: PriceLine[];
  totalVolumeM3: number;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
};

export function totalVolume(inventory: InventoryItem[]): number {
  const v = inventory.reduce(
    (sum, item) => sum + (item.volumeM3 || 0) * (item.quantity || 0),
    0,
  );
  return Math.round(v * 100) / 100;
}

type MoveTariffFields = Pick<
  Company,
  | "baseFeeCents"
  | "pricePerM3Cents"
  | "pricePerKmCents"
  | "packingFeeCents"
  | "assemblyFeeCents"
  | "storagePerMonthCents"
  | "minPriceCents"
  | "moveFloorSurchargeCents"
  | "liftFeeCents"
  | "vatRate"
>;

/**
 * Berekent de verhuisofferte: inboedel (m³) + transport + verdieping-toeslagen +
 * verhuislift + extra opties.
 */
export function calculatePrice(
  company: MoveTariffFields,
  input: {
    inventory: InventoryItem[];
    distanceKm: number;
    options: LeadOptions;
    fromFloor?: number;
    toFloor?: number;
    fromLiftService?: boolean;
    toLiftService?: boolean;
  },
): PriceResult {
  const volume = totalVolume(input.inventory);
  const billableVolume = Math.max(1, Math.ceil(volume));
  const km = Math.max(0, Math.round(input.distanceKm));
  const storageMonths = Math.max(0, Math.round(input.options.storageMonths ?? 0));
  const fromFloor = Math.max(0, Math.round(input.fromFloor ?? 0));
  const toFloor = Math.max(0, Math.round(input.toFloor ?? 0));

  const lines: PriceLine[] = [
    { label: "Voorrijkosten", amountCents: company.baseFeeCents },
    {
      label: `Inboedel (${billableVolume} m³)`,
      amountCents: billableVolume * company.pricePerM3Cents,
    },
  ];

  if (km > 0) {
    lines.push({
      label: `Transport (${km} km)`,
      amountCents: km * company.pricePerKmCents,
    });
  }

  const floors = fromFloor + toFloor;
  if (floors > 0 && company.moveFloorSurchargeCents > 0) {
    lines.push({
      label: `Verdieping-toeslag (${floors}×)`,
      amountCents: floors * company.moveFloorSurchargeCents,
    });
  }
  const lifts = (input.fromLiftService ? 1 : 0) + (input.toLiftService ? 1 : 0);
  if (lifts > 0) {
    lines.push({
      label: `Verhuislift (${lifts}×)`,
      amountCents: lifts * company.liftFeeCents,
    });
  }
  if (input.options.packing) {
    lines.push({ label: "Inpakservice", amountCents: company.packingFeeCents });
  }
  if (input.options.assembly) {
    lines.push({
      label: "Meubelmontage en -demontage",
      amountCents: company.assemblyFeeCents,
    });
  }
  if (storageMonths > 0) {
    lines.push({
      label: `Opslag (${storageMonths} ${storageMonths === 1 ? "maand" : "maanden"})`,
      amountCents: storageMonths * company.storagePerMonthCents,
    });
  }

  let subtotal = lines.reduce((sum, l) => sum + l.amountCents, 0);

  if (subtotal < company.minPriceCents) {
    lines.push({
      label: "Toeslag minimumtarief",
      amountCents: company.minPriceCents - subtotal,
    });
    subtotal = company.minPriceCents;
  }

  const vat = Math.round(subtotal * Number(company.vatRate));

  return {
    breakdown: lines,
    totalVolumeM3: volume,
    subtotalCents: subtotal,
    vatCents: vat,
    totalCents: subtotal + vat,
  };
}

// --- Ontruiming (m²-model) ---------------------------------------------------

const FILL_LABEL: Record<ClearanceFill, string> = {
  minimaal: "minimaal bewoond",
  normaal: "normaal bewoond",
  vol: "vol",
  overvol: "overvol",
};

export function clearanceTariffs(
  company: Pick<Company, "ontruimenTariffs">,
): ClearanceTariffs {
  return { ...CLEARANCE_TARIFF_DEFAULTS, ...(company.ontruimenTariffs ?? {}) };
}

/**
 * Berekent de ontruimingsprijs op basis van oppervlak, vulgraad (AI), verdieping
 * en gekozen extra werkzaamheden.
 */
export function calculateClearancePrice(
  t: ClearanceTariffs,
  input: {
    areaM2: number;
    floor: number;
    hasLift: boolean;
    fillLevel: ClearanceFill;
    works: ClearanceWorks;
    vatRate: number | string;
  },
): PriceResult {
  const m2 = Math.max(1, Math.round(input.areaM2));
  const floor = Math.max(0, Math.round(input.floor));
  const factorPct =
    input.fillLevel === "minimaal"
      ? t.fillFactorMinimaal
      : input.fillLevel === "vol"
        ? t.fillFactorVol
        : input.fillLevel === "overvol"
          ? t.fillFactorOvervol
          : t.fillFactorNormaal;

  const baseCents = Math.round((m2 * t.pricePerM2Cents * factorPct) / 100);

  const lines: PriceLine[] = [
    {
      label: `Ontruiming (${m2} m², ${FILL_LABEL[input.fillLevel]})`,
      amountCents: baseCents,
    },
  ];

  if (floor > 0) {
    lines.push({
      label: `Verdieping (${floor}e)`,
      amountCents: floor * t.floorSurchargeCents,
    });
  }
  if (floor > 0 && !input.hasLift) {
    lines.push({ label: "Geen lift", amountCents: t.noLiftSurchargeCents });
  }

  if (input.works.wallpaper) {
    lines.push({
      label: `Behang verwijderen (${m2} m²)`,
      amountCents: m2 * t.wallpaperPerM2Cents,
    });
  }
  if (input.works.holes) {
    lines.push({
      label: `Gaatjes stoppen (${m2} m²)`,
      amountCents: m2 * t.holesPerM2Cents,
    });
  }
  if (input.works.painting) {
    lines.push({
      label: `Schilderwerk (${m2} m²)`,
      amountCents: m2 * t.paintPerM2Cents,
    });
  }
  if (input.works.floorRemoval) {
    lines.push({
      label: `Vloer verwijderen (${m2} m²)`,
      amountCents: m2 * t.floorRemovalPerM2Cents,
    });
  }
  if (input.works.curtains) {
    lines.push({ label: "Gordijnen verwijderen", amountCents: t.curtainsCents });
  }

  lines.push({ label: "Transport & verwerking", amountCents: t.transportCents });

  let subtotal = lines.reduce((sum, l) => sum + l.amountCents, 0);
  if (subtotal < t.minPriceCents) {
    lines.push({
      label: "Toeslag minimumtarief",
      amountCents: t.minPriceCents - subtotal,
    });
    subtotal = t.minPriceCents;
  }

  const vat = Math.round(subtotal * Number(input.vatRate));

  return {
    breakdown: lines,
    totalVolumeM3: 0,
    subtotalCents: subtotal,
    vatCents: vat,
    totalCents: subtotal + vat,
  };
}
