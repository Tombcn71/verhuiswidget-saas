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
  primaryColor: "#2563eb",
  phone: null as string | null,
  serviceType: "beide" as const,
};
