import {
  CLEARANCE_TARIFF_DEFAULTS,
  type ClearanceTariffs,
  type Company,
  type InventoryItem,
  type LeadOptions,
  type PriceLine,
} from "@/lib/db/schema";

export type PriceResult = {
  breakdown: PriceLine[];
  totalVolumeM3: number;
  /** Geschat aantal ritten van de verhuiswagen. */
  trips: number;
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
  | "truckAccessSurchargeCents"
  | "rushSurchargeCents"
  | "hourlyRatePerMoverCents"
  | "m3PerHourPerMover"
  | "truckCapacityM3"
  | "vatRate"
>;

/** Is de gewenste datum binnen 48 uur? */
export function isRushDate(moveDate: string | undefined | null): boolean {
  if (!moveDate) return false;
  const target = new Date(`${moveDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return false;
  const hours = (target.getTime() - Date.now()) / 3_600_000;
  return hours < 48;
}

/** Aantal verhuizers op basis van het inboedelvolume. */
function moversForVolume(volume: number): number {
  if (volume <= 10) return 2;
  if (volume <= 22) return 3;
  return 4;
}

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
    /** Gebouwlift aanwezig — verdieping-toeslag vervalt dan. */
    hasElevator?: boolean;
    /** Woning bereikbaar voor de verhuiswagen (default true). */
    streetAccessible?: boolean;
    /** Gewenste datum binnen 48 uur — spoedtoeslag. */
    rush?: boolean;
    fromLiftService?: boolean;
    toLiftService?: boolean;
  },
): PriceResult {
  const volume = totalVolume(input.inventory);
  const billableVolume = Math.max(1, Math.ceil(volume));
  const km = Math.max(0, Math.round(input.distanceKm));
  const truckCapacity = Math.max(1, Math.round(Number(company.truckCapacityM3) || 20));
  const trips = Math.max(1, Math.ceil(billableVolume / truckCapacity));
  const storageMonths = Math.max(0, Math.round(input.options.storageMonths ?? 0));
  const fromFloor = Math.max(0, Math.round(input.fromFloor ?? 0));
  const toFloor = Math.max(0, Math.round(input.toFloor ?? 0));
  const floors = fromFloor + toFloor;

  const lines: PriceLine[] = [
    { label: "Voorrijkosten", amountCents: company.baseFeeCents },
    {
      label: `Inboedel (${billableVolume} m³)`,
      amountCents: billableVolume * company.pricePerM3Cents,
    },
  ];

  // --- Arbeid: aantal verhuizers × geschatte uren × uurtarief -----------------
  const movers = moversForVolume(volume);
  const throughput = Math.max(0.5, Number(company.m3PerHourPerMover) || 1.8);
  let hours = volume / (movers * throughput); // laden + lossen
  if (floors > 0 && !input.hasElevator) hours += floors * 0.4; // trappen
  hours += (km / 45) * 2 * trips; // reistijd heen + terug per rit (~45 km/u)
  hours = Math.max(2, Math.ceil(hours * 2) / 2); // afronden op halve uren, min. 2u
  lines.push({
    label: `Mankracht (${movers} × ${hours.toLocaleString("nl-NL")} uur)`,
    amountCents: Math.round(hours * movers * company.hourlyRatePerMoverCents),
  });

  if (km > 0) {
    const drivenKm = km * (2 * trips - 1); // heen vol, leeg terug, opnieuw…
    lines.push({
      label:
        trips > 1
          ? `Transport (${trips} ritten · ${km} km)`
          : `Transport (${km} km)`,
      amountCents: drivenKm * company.pricePerKmCents,
    });
  }

  // Met een gebouwlift vervalt de verdieping-toeslag.
  if (floors > 0 && !input.hasElevator && company.moveFloorSurchargeCents > 0) {
    lines.push({
      label: `Verdieping-toeslag (${floors}×)`,
      amountCents: floors * company.moveFloorSurchargeCents,
    });
  }

  // Verhuislift: expliciet gevraagd, of automatisch bij etage 3+ zonder lift.
  const autoLift = fromFloor >= 3 && !input.hasElevator;
  const lifts =
    (input.fromLiftService || autoLift ? 1 : 0) + (input.toLiftService ? 1 : 0);
  if (lifts > 0) {
    lines.push({
      label: `Verhuislift (${lifts}×)`,
      amountCents: lifts * company.liftFeeCents,
    });
  }

  if (input.streetAccessible === false && company.truckAccessSurchargeCents > 0) {
    lines.push({
      label: "Slechte bereikbaarheid",
      amountCents: company.truckAccessSurchargeCents,
    });
  }

  if (input.rush && company.rushSurchargeCents > 0) {
    lines.push({
      label: "Spoedtoeslag (binnen 48 uur)",
      amountCents: company.rushSurchargeCents,
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
    trips,
    subtotalCents: subtotal,
    vatCents: vat,
    totalCents: subtotal + vat,
  };
}

// --- Ontruiming: extra werkzaamheden ---------------------------------------

/** Vloertypes voor "vloer verwijderen"; tarief per type komt uit ClearanceTariffs. */
export const FLOOR_TYPES: {
  key: string;
  label: string;
  tariffKey: keyof ClearanceTariffs;
}[] = [
  { key: "laminaat", label: "Laminaat (niet gelijmd)", tariffKey: "floorLaminaatCents" },
  { key: "tapijt", label: "Tapijt / vloerbedekking", tariffKey: "floorTapijtCents" },
  { key: "pvc_click", label: "PVC click", tariffKey: "floorPvcClickCents" },
  { key: "kurk", label: "Kurkvloer", tariffKey: "floorKurkCents" },
  { key: "pvc_gelijmd", label: "PVC gelijmd", tariffKey: "floorPvcGelijmdCents" },
  { key: "parket_gelijmd", label: "Parket gelijmd", tariffKey: "floorParketGelijmdCents" },
  { key: "tegelvloer", label: "Tegelvloer", tariffKey: "floorTegelvloerCents" },
];

export function floorTypeRate(t: ClearanceTariffs, key: string): number {
  const ft = FLOOR_TYPES.find((f) => f.key === key);
  return ft ? t[ft.tariffKey] : t.floorLaminaatCents;
}

export function clearanceTariffs(
  company: Pick<Company, "ontruimenTariffs">,
): ClearanceTariffs {
  return { ...CLEARANCE_TARIFF_DEFAULTS, ...(company.ontruimenTariffs ?? {}) };
}
