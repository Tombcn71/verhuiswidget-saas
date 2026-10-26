import { DRIVE_KMH } from "@/lib/pricing";

/** De klus zoals die op een factuur staat (zie lib/gemini#extractTariffs). */
export type InvoiceJob = {
  volumeM3: number | null;
  hours: number | null;
  movers: number | null;
  /** Afstand van de rit (ophaal → bezorgadres). */
  km: number | null;
  /** Zitten de uren inclusief rijden? null = niet te zien op de factuur. */
  travelIncluded: boolean | null;
};

export type DerivedWorkSettings = {
  tempoM3: number;
  tempoHours: number;
  tempoMovers: number;
  crewTwoMaxM3: number;
  crewThreeMaxM3: number;
  travelMode: "rit" | "geen";
};

/** Standaard ploeg per volume (zie lib/db/schema). */
const CREW_DEFAULTS = { two: 15, three: 35 };

/**
 * Leidt tempo, ploeg en reistijd af uit de klus op de factuur, zodat de app
 * diezelfde klus op dezelfde uren uitrekent. Het rijden gaat er eerst af
 * (als het in de uren zit), anders telt het in de offerte dubbel.
 */
export function deriveWorkSettings(
  job: InvoiceJob,
  travelIncluded: boolean,
): DerivedWorkSettings | null {
  const { volumeM3, hours, movers } = job;
  if (!volumeM3 || !hours || !movers || volumeM3 <= 0 || hours <= 0) return null;
  const crew = Math.round(movers);
  if (crew < 1 || crew > 8) return null;

  const travelHours = travelIncluded && job.km ? job.km / DRIVE_KMH : 0;
  const work = hours - travelHours;
  if (work <= 0) return null;
  // Naar beneden op 0,1 uur: de uren op een factuur zijn al naar boven afgerond.
  const tempoHours = Math.max(0.5, Math.floor(work * 10) / 10);

  // Ploeg: zorg dat dit volume bij de ploeg van de factuur hoort.
  const v = Math.ceil(volumeM3);
  let two = CREW_DEFAULTS.two;
  let three = CREW_DEFAULTS.three;
  if (crew <= 2) {
    two = Math.max(two, v);
    three = Math.max(three, two + 1);
  } else if (crew === 3) {
    if (v <= two) two = Math.max(1, v - 1);
    three = Math.max(three, v);
  } else {
    if (v <= three) three = Math.max(two + 1, v - 1);
  }

  return {
    tempoM3: Math.round(volumeM3 * 10) / 10,
    tempoHours,
    tempoMovers: crew,
    crewTwoMaxM3: two,
    crewThreeMaxM3: three,
    travelMode: travelIncluded ? "rit" : "geen",
  };
}
