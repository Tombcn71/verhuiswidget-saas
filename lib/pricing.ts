import type { Company, InventoryItem, LeadOptions, PriceLine } from "@/lib/db/schema";

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

/**
 * Berekent de offerteprijs op basis van de tarieven van één specifieke verhuizer.
 */
export function calculatePrice(
  company: Pick<
    Company,
    | "baseFeeCents"
    | "pricePerM3Cents"
    | "pricePerKmCents"
    | "packingFeeCents"
    | "assemblyFeeCents"
    | "storagePerMonthCents"
    | "minPriceCents"
    | "vatRate"
  >,
  input: {
    inventory: InventoryItem[];
    distanceKm: number;
    options: LeadOptions;
  },
): PriceResult {
  const volume = totalVolume(input.inventory);
  const billableVolume = Math.max(1, Math.ceil(volume));
  const km = Math.max(0, Math.round(input.distanceKm));
  const storageMonths = Math.max(0, Math.round(input.options.storageMonths ?? 0));

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

  const vatRate = Number(company.vatRate);
  const vat = Math.round(subtotal * vatRate);

  return {
    breakdown: lines,
    totalVolumeM3: volume,
    subtotalCents: subtotal,
    vatCents: vat,
    totalCents: subtotal + vat,
  };
}
