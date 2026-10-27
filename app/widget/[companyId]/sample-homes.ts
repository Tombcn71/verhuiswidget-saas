/**
 * Voorbeeldwoningen voor de preview (Tarieven → "Test je tarieven") en de demo:
 * de verhuizer heeft zelf geen foto's bij de hand, dus deze gaan door de echte
 * AI-analyse. Foto's in public/voorbeeldwoningen/<id>/<bestand>.jpg.
 *
 * `volume` is wat de AI er gemeten uit haalt (niet een wens); na een wijziging
 * in de prompt (lib/gemini.ts) opnieuw meten en bijwerken.
 */
import { Building2, House, Trees, type LucideIcon } from "lucide-react";

export type SampleHome = {
  id: string;
  title: string;
  Icon: LucideIcon;
  areaM2: number;
  rooms: string;
  volume: number;
  /** Kamernaam in de widget → bestandsnaam. */
  photos: { room: string; file: string }[];
};

export const SAMPLE_HOMES: SampleHome[] = [
  {
    id: "appartement",
    title: "Appartement",
    Icon: Building2,
    areaM2: 75,
    rooms: "Woonkamer · 2 slaapkamers · keuken · berging",
    volume: 30,
    photos: [
      { room: "Woonkamer", file: "woonkamer" },
      { room: "Slaapkamer", file: "slaapkamer" },
      { room: "Slaapkamer 2", file: "slaapkamer-2" },
      { room: "Keuken", file: "keuken" },
      { room: "Berging", file: "berging" },
    ],
  },
  {
    id: "eengezinswoning",
    title: "Eengezinswoning",
    Icon: House,
    areaM2: 120,
    rooms: "Woonkamer · 3 slaapkamers · keuken · zolder · schuur",
    volume: 50,
    photos: [
      { room: "Woonkamer", file: "woonkamer" },
      { room: "Keuken", file: "keuken" },
      { room: "Slaapkamer", file: "slaapkamer" },
      { room: "Slaapkamer 2", file: "slaapkamer-2" },
      { room: "Slaapkamer 3", file: "slaapkamer-3" },
      { room: "Zolder", file: "zolder" },
      { room: "Schuur", file: "schuur" },
    ],
  },
  {
    id: "vrijstaand",
    title: "Vrijstaande woning",
    Icon: Trees,
    areaM2: 180,
    rooms: "Woonkamer · eetkamer · 4 slaapkamers · keuken · werkkamer · zolder · garage",
    volume: 75,
    photos: [
      { room: "Woonkamer", file: "woonkamer" },
      { room: "Eetkamer", file: "eetkamer" },
      { room: "Keuken", file: "keuken" },
      { room: "Slaapkamer", file: "slaapkamer" },
      { room: "Slaapkamer 2", file: "slaapkamer-2" },
      { room: "Slaapkamer 3", file: "slaapkamer-3" },
      { room: "Slaapkamer 4", file: "slaapkamer-4" },
      { room: "Werkkamer", file: "werkkamer" },
      { room: "Zolder", file: "zolder" },
      { room: "Garage", file: "garage" },
    ],
  },
];
