/**
 * Basis-URL van de app, voor links die buiten de app leven (widget-deel-link,
 * embed-script, preview-iframe).
 *
 * Volgorde:
 * 1. NEXT_PUBLIC_APP_URL — zet deze op Vercel op je eigen domein (bijv.
 *    https://app.moverai.nl). Wordt bij de build vastgezet.
 * 2. VERCEL_PROJECT_PRODUCTION_URL — stabiele productie-URL van het project,
 *    automatisch door Vercel gezet. Vangnet als stap 1 ontbreekt.
 * 3. localhost — alleen lokaal.
 */
export function appUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
