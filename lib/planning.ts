import type { MovePlanning } from "@/lib/pricing";

const fmt = (n: number) => n.toLocaleString("nl-NL", { maximumFractionDigits: 1 });

/**
 * "Wat moet ik inplannen?" voor de verhuizer: wagens, ploeg, duur en volume.
 * Gedeeld door de leadmail en het slotscherm van de demo, zodat ze hetzelfde zeggen.
 */
export function planningRows(
  planning: MovePlanning,
  volumeM3: number,
): { icon: string; label: string; value: string }[] {
  const { vans, truckM3, moversPerVan, hours, workHours, travelHours, boxes } = planning;
  const rows = [
    {
      icon: "🚚",
      label: "Wagens",
      value: vans > 1 ? `${vans} wagens van ${truckM3} m³` : `1 wagen van ${truckM3} m³`,
    },
    {
      icon: "👷",
      label: "Ploeg",
      value: vans > 1 ? `${vans * moversPerVan} man (${moversPerVan} per wagen)` : `${moversPerVan} man`,
    },
    {
      icon: "⏱️",
      label: "Duur",
      value:
        `± ${fmt(hours)} uur` +
        (travelHours > 0
          ? ` (${fmt(workHours)} uur werk + ${fmt(travelHours)} uur rijden)`
          : ` (${fmt(workHours)} uur werk)`),
    },
    {
      icon: "📦",
      label: "Volume",
      value: `${fmt(volumeM3)} m³${boxes > 0 ? ` · ${boxes} verhuisdozen` : ""}`,
    },
  ];
  return rows;
}
