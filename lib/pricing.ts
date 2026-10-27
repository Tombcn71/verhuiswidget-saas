import {
  CLEARANCE_TARIFF_DEFAULTS,
  type ClearanceTariffs,
  type Company,
  type InventoryItem,
  type LeadOptions,
  type PriceLine,
} from "@/lib/db/schema";

/** Wat de verhuizer moet inplannen (verhuizen); voor de leadmail en de demo. */
export type MovePlanning = {
  vans: number;
  truckM3: number;
  moversPerVan: number;
  /** Uren op de offerte (afgerond, minimaal het minimum). */
  hours: number;
  workHours: number;
  travelHours: number;
  boxes: number;
};

export type PriceResult = {
  breakdown: PriceLine[];
  totalVolumeM3: number;
  /** Aantal wagens (verhuizen) / ritten naar de milieustraat (ontruimen). */
  trips: number;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  planning?: MovePlanning;
};

/** Aantal verhuisdozen in de scan (kastinhoud + losse spullen, zie lib/gemini). */
export function boxCount(inventory: InventoryItem[]): number {
  return inventory
    .filter((item) => /verhuisdo/i.test(item.name))
    .reduce((sum, item) => sum + (item.quantity || 0), 0);
}

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
  | "pricingMode"
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
  | "stairMinutesPerFloor"
  | "truckCapacityM3"
  | "vatRate"
  | "crewTwoMaxM3"
  | "crewThreeMaxM3"
  | "vanRateCents"
  | "vanRateUnit"
  | "travelMode"
  | "minHours"
  | "roundingMinutes"
  | "saturdaySurchargePct"
  | "sundaySurchargePct"
  | "tempoM3"
  | "tempoHours"
  | "tempoMovers"
  | "boxPriceCents"
>;

/** Gemiddelde rijsnelheid van een verhuiswagen voor de reistijd. */
export const DRIVE_KMH = 45;

/** m³ per verhuizer per uur uit het tempo ("30 m³ in 5,5 uur met 3 man"). */
export function throughputPerMover(
  company: Pick<Company, "tempoM3" | "tempoHours" | "tempoMovers" | "m3PerHourPerMover">,
): number {
  const m3 = Number(company.tempoM3);
  const hours = Number(company.tempoHours);
  const movers = company.tempoMovers;
  const speed =
    m3 > 0 && hours > 0 && movers > 0 ? m3 / (hours * movers) : Number(company.m3PerHourPerMover);
  return Math.max(0.3, speed || 1.8);
}

const fmtHours = (h: number) => h.toLocaleString("nl-NL", { maximumFractionDigits: 1 });

/** Afronden naar boven op kwartier, half uur of heel uur. */
function roundUpHours(hours: number, roundingMinutes: number): number {
  const step = [15, 30, 60].includes(roundingMinutes) ? roundingMinutes / 60 : 0.5;
  return Math.ceil(hours / step - 1e-9) * step;
}

const ROUNDING_LABEL: Record<number, string> = {
  15: "kwartier",
  30: "half uur",
  60: "heel uur",
};

/** 6 = zaterdag, 0 = zondag, anders null. */
function weekendDay(moveDate: string | undefined | null): 0 | 6 | null {
  if (!moveDate) return null;
  const d = new Date(`${moveDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const day = d.getDay();
  return day === 0 || day === 6 ? day : null;
}

/** Is de gewenste datum binnen 48 uur? */
export function isRushDate(moveDate: string | undefined | null): boolean {
  if (!moveDate) return false;
  const target = new Date(`${moveDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return false;
  const hours = (target.getTime() - Date.now()) / 3_600_000;
  return hours < 48;
}

/** Aantal verhuizers op basis van het inboedelvolume (ploeg per volume van de verhuizer). */
export function moversForVolume(
  company: Pick<Company, "crewTwoMaxM3" | "crewThreeMaxM3">,
  volume: number,
): number {
  if (volume <= company.crewTwoMaxM3) return 2;
  if (volume <= company.crewThreeMaxM3) return 3;
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
    /** Vestiging → ophaaladres en terug (km); 0 als er geen vestigingsadres is. */
    approachKm?: number;
    options: LeadOptions;
    fromFloor?: number;
    toFloor?: number;
    /** Gebouwlift aanwezig — verdieping-toeslag vervalt dan. */
    hasElevator?: boolean;
    /** Woning bereikbaar voor de verhuiswagen (default true). */
    streetAccessible?: boolean;
    /** Gewenste datum binnen 48 uur — spoedtoeslag. */
    rush?: boolean;
    /** Gewenste datum (JJJJ-MM-DD) — voor de weekendtoeslag. */
    moveDate?: string | null;
    fromLiftService?: boolean;
    toLiftService?: boolean;
  },
): PriceResult {
  const volume = totalVolume(input.inventory);
  const billableVolume = Math.max(1, Math.ceil(volume));
  const km = Math.max(0, Math.round(input.distanceKm));
  const truckCapacity = Math.max(1, Math.round(Number(company.truckCapacityM3) || 40));
  // Past de inboedel niet in één wagen, dan komen er meer wagens tegelijk, elk
  // met een eigen ploeg (zoals verhuizers dat doen), i.p.v. heen-en-weer rijden.
  const vans = Math.max(1, Math.ceil(billableVolume / truckCapacity));
  const storageMonths = Math.max(0, Math.round(input.options.storageMonths ?? 0));
  const fromFloor = Math.max(0, Math.round(input.fromFloor ?? 0));
  const toFloor = Math.max(0, Math.round(input.toFloor ?? 0));
  const floors = fromFloor + toFloor;

  const approachKm = Math.max(0, Math.round(input.approachKm ?? 0));
  const vansNote = vans > 1 ? ` · ${vans} wagens` : "";
  const weekend = weekendDay(input.moveDate);
  const weekendPct =
    weekend === 6 ? company.saturdaySurchargePct : weekend === 0 ? company.sundaySurchargePct : 0;

  const lines: PriceLine[] = [
    { label: "Voorrijkosten", amountCents: company.baseFeeCents },
  ];
  // Basis voor de weekendtoeslag: mankracht (+ wagen per uur), of de inboedel bij m³.
  let weekendBaseCents = 0;

  // Ploeg en uren: de prijs bij een uurtarief, en bij m³ alleen voor de planning.
  // Elke wagen krijgt de ploeg die bij zijn deel van het volume hoort.
  const crewPerVan = moversForVolume(company, volume / vans);
  const movers = crewPerVan * vans;
  const throughput = throughputPerMover(company);
  const stairHours =
    floors > 0 && !input.hasElevator ? (floors * company.stairMinutesPerFloor) / 60 : 0;
  const workHours = volume / (movers * throughput) + stairHours; // laden + lossen (+ trappen)
  // De wagens rijden tegelijk: de rijtijd telt één keer.
  const travelKm =
    company.travelMode === "geen" ? 0 : company.travelMode === "loods" ? km + approachKm : km;
  const travelHours = travelKm / DRIVE_KMH;
  const minHours = Math.max(0, Number(company.minHours) || 0);
  const rounded = roundUpHours(workHours + travelHours, company.roundingMinutes);
  const hours = Math.max(minHours, rounded);
  const planning: MovePlanning = {
    vans,
    truckM3: truckCapacity,
    moversPerVan: crewPerVan,
    hours,
    workHours,
    travelHours,
    boxes: boxCount(input.inventory),
  };

  if (company.pricingMode === "m3") {
    // --- Per m³: mankracht zit in de m³-prijs -----------------------------------
    const amountCents = billableVolume * company.pricePerM3Cents;
    lines.push({ label: `Inboedel (${billableVolume} m³)`, amountCents });
    weekendBaseCents = amountCents;
  } else {
    // --- Per uur: ploeg × uren × uurtarief, zoals de verhuizer zelf rekent -------
    const detail =
      (vans > 1 ? `${vans} wagens van ${truckCapacity} m³, elk met ${crewPerVan} man. ` : "") +
      [
        `${fmtHours(workHours)} uur werk (${fmtHours(volume)} m³${stairHours > 0 ? " incl. trappen" : ""})`,
        travelHours > 0 ? `${fmtHours(travelHours)} uur rijden (${travelKm} km)` : null,
      ]
        .filter(Boolean)
        .join(" + ");
    const roundingNote =
      hours > rounded
        ? `minimaal ${fmtHours(minHours)} uur`
        : `afgerond op ${ROUNDING_LABEL[company.roundingMinutes] ?? "half uur"}`;

    const laborCents = Math.round(hours * movers * company.hourlyRatePerMoverCents);
    lines.push({
      label: `Mankracht (${movers} man × ${fmtHours(hours)} uur)`,
      amountCents: laborCents,
      detail: `${detail}, ${roundingNote}`,
    });
    weekendBaseCents = laborCents;

    // Verhuiswagen als eigen regel (€0 = zit al in het uurtarief).
    if (company.vanRateCents > 0) {
      const vanLabel = vans > 1 ? `${vans} verhuiswagens` : "Verhuiswagen";
      if (company.vanRateUnit === "dag") {
        const days = Math.max(1, Math.ceil(hours / 8));
        lines.push({
          label: `${vanLabel} (${days} ${days === 1 ? "dag" : "dagen"})`,
          amountCents: vans * days * company.vanRateCents,
        });
      } else if (company.vanRateUnit === "rit") {
        lines.push({
          label: `${vanLabel} (1 rit)`,
          amountCents: vans * company.vanRateCents,
        });
      } else {
        const vanCents = Math.round(vans * hours * company.vanRateCents);
        lines.push({ label: `${vanLabel} (${fmtHours(hours)} uur)`, amountCents: vanCents });
        weekendBaseCents += vanCents;
      }
    }
  }

  if (weekendPct > 0 && weekendBaseCents > 0) {
    lines.push({
      label: `${weekend === 6 ? "Zaterdag" : "Zondag"}toeslag (${weekendPct}%)`,
      amountCents: Math.round((weekendBaseCents * weekendPct) / 100),
      detail: company.pricingMode === "m3" ? "Over de inboedel" : "Over de mankracht",
    });
  }

  // Elke wagen rijdt de kilometers.
  if (km > 0) {
    lines.push({
      label: `Transport (${km} km${vansNote})`,
      amountCents: vans * km * company.pricePerKmCents,
    });
  }

  if (approachKm > 0) {
    lines.push({
      label: `Aan- en afrijden (${approachKm} km${vansNote})`,
      amountCents: vans * approachKm * company.pricePerKmCents,
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
  if (input.options.boxes && company.boxPriceCents > 0) {
    const boxes = boxCount(input.inventory);
    if (boxes > 0)
      lines.push({
        label: `Verhuisdozen (${boxes} × ${(company.boxPriceCents / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" })})`,
        amountCents: boxes * company.boxPriceCents,
        detail: "Aantal uit de inboedelscan",
      });
  }
  if (storageMonths > 0) {
    lines.push({
      label: `Opslag (${storageMonths} ${storageMonths === 1 ? "maand" : "maanden"})`,
      amountCents: storageMonths * company.storagePerMonthCents,
    });
  }

  // Regels van €0 (bijv. prijs per m³ bij een uurtarief) niet tonen.
  const shown = lines.filter((l) => l.amountCents > 0);
  let subtotal = shown.reduce((sum, l) => sum + l.amountCents, 0);

  if (subtotal < company.minPriceCents) {
    shown.push({
      label: "Toeslag minimumtarief",
      amountCents: company.minPriceCents - subtotal,
    });
    subtotal = company.minPriceCents;
  }

  const vat = Math.round(subtotal * Number(company.vatRate));

  return {
    breakdown: shown,
    totalVolumeM3: volume,
    trips: vans,
    subtotalCents: subtotal,
    vatCents: vat,
    totalCents: subtotal + vat,
    planning,
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
