/**
 * Vaste verhuizer die de publieke "probeer de demo"-widget op de landing gebruikt.
 * Bij een demo-aanvraag draait de foto-analyse + prijsberekening écht, maar wordt
 * er géén lead opgeslagen en géén e-mail verstuurd (zie `app/api/widget/submit`).
 *
 * Alleen constants hier — geen DB-imports, zodat dit bestand ook client-side
 * (in de demo-modal) veilig te importeren is. De server-helper staat in
 * `lib/companies.ts` (`ensureDemoCompany`).
 */
export const DEMO_COMPANY_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_CLERK_ID = "__demo__";

export function isDemoCompany(id: string): boolean {
  return id === DEMO_COMPANY_ID;
}

/** Publieke bedrijfsprops voor de demo-widget (geen DB-call nodig op de landing). */
export const DEMO_COMPANY_PUBLIC = {
  id: DEMO_COMPANY_ID,
  name: "Demo Verhuisbedrijf",
  logoUrl: null as string | null,
  primaryColor: "#1a73e8",
  phone: "020 123 45 67" as string | null,
  serviceType: "beide" as const,
};

/**
 * Voorbeeldgegevens van het demobedrijf, zodat de demo-mails er net zo compleet
 * uitzien als bij een echte verhuizer. Antwoorden op een demo-mail komen bij
 * moverAI binnen (info@).
 */
export const DEMO_COMPANY_DETAILS = {
  email: "info@moverai.nl",
  phone: "020 123 45 67",
  website: "moverai.nl",
  emailSignature:
    "Met vriendelijke groet,\n\nSanne de Vries\nDemo Verhuisbedrijf\n020 123 45 67 · moverai.nl\n\nDit is een voorbeeld van moverAI: zo krijgen jouw klanten hun offerte.",
};

/**
 * Boekingslink voor een demo-offerte. Er is geen lead, dus de gegevens reizen
 * mee in de URL; /boeken/demo toont daarmee de bevestigingspagina zonder iets
 * op te slaan.
 */
export function demoBookingUrl(
  base: string,
  input: {
    name: string;
    totalCents: number;
    moveDate?: string | null;
    moveType: string;
    fromAddress?: string | null;
    toAddress?: string | null;
    volumeM3?: number;
    /** Demo-lead (alleen met toestemming), zodat een klik op "boeken" geregistreerd wordt. */
    demoLeadId?: string | null;
  },
): string {
  const params = new URLSearchParams({
    n: input.name,
    b: String(Math.round(input.totalCents)),
    s: input.moveType === "ontruiming" ? "ontruiming" : "verhuizing",
  });
  if (input.moveDate) params.set("d", input.moveDate);
  if (input.fromAddress) params.set("van", input.fromAddress);
  if (input.toAddress) params.set("naar", input.toAddress);
  if (input.volumeM3) params.set("m3", input.volumeM3.toFixed(1));
  if (input.demoLeadId) params.set("dl", input.demoLeadId);
  return `${base}/boeken/demo?${params}`;
}
