/**
 * Zoekt een e-mailadres en WhatsApp op de website van een bedrijf (homepage,
 * anders de contactpagina). Gebruikt bij het ophalen van verhuisbedrijven via Google.
 */

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
// Geen plaatjes ("logo@2x.png") of adressen van websitebouwers/trackers.
const IGNORE = /\.(png|jpe?g|gif|svg|webp)$|@(example|sentry|wixpress|domain|email)\.|^(noreply|no-reply)@/i;
// Chatlink met nummer: wa.me/316…, api.whatsapp.com/send?phone=316…
const WA_NUMBER = /(?:wa\.me\/|whatsapp\.com\/send\/?\?phone=|whatsapp:\/\/send\/?\?phone=)\+?(\d[\d\s-]{7,16}\d)/i;

// Een online offerteroute: calculator/configurator of een offerte- of prijsformulier.
const CALCULATOR = /prijs\s?calculator|kozijn\s?configurator|configurator|calculator|bereken\s+(uw|je|jouw|de)?\s*(prijs|kozijn|offerte)|prijs\s+berekenen|stel\s+(uw|je|jouw)\s+kozijn|prijsindicatie\s+(berekenen|aanvragen)/i;

export type SiteScan = { email: string | null; whatsapp: string | null; calculator: boolean };

/** Calculator of configurator, of een formulier waar offerte of prijs bij staat. */
function heeftOnlineOfferte(html: string): boolean {
  if (CALCULATOR.test(html)) return true;
  return /<form[\s\S]{0,4000}?(offerte|prijs)/i.test(html) && /name=["']?(breedte|hoogte|afmeting)/i.test(html);
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "Mozilla/5.0 (moverAI; +https://www.moverai.nl)" },
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return null;
    return (await res.text()).slice(0, 600_000);
  } catch {
    return null;
  }
}

function pickEmail(html: string, host: string): string | null {
  const decoded = html.replace(/&#64;|\[at\]|\(at\)/gi, "@");
  const found = [...new Set((decoded.match(EMAIL) ?? []).map((e) => e.toLowerCase()))].filter(
    (e) => !IGNORE.test(e),
  );
  if (!found.length) return null;
  // Voorkeur: adres op het eigen domein, en dan info@/contact@.
  const domain = host.replace(/^www\./, "");
  const own = found.filter((e) => e.endsWith(`@${domain}`));
  const pool = own.length ? own : found;
  return pool.find((e) => /^(info|contact|planning|offerte)@/.test(e)) ?? pool[0];
}

/** WhatsApp-nummer uit een chatlink, of "ja" als WhatsApp alleen genoemd wordt (bijv. een chatwidget). */
function pickWhatsapp(html: string): string | null {
  const m = html.match(WA_NUMBER);
  if (m) {
    const digits = m[1].replace(/\D/g, "");
    return digits.startsWith("06") ? `31${digits.slice(1)}` : digits;
  }
  return /whatsapp/i.test(html) ? "ja" : null;
}

export async function scanWebsite(website: string): Promise<SiteScan> {
  let base: URL;
  try {
    base = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
  } catch {
    return { email: null, whatsapp: null, calculator: false };
  }
  let calculator = false;
  let email: string | null = null;
  let whatsapp: string | null = null;
  for (const path of ["", "/contact", "/offerte", "/offerte-aanvragen", "/prijzen", "/configurator"]) {
    const html = await fetchHtml(new URL(path || base.pathname, base).toString());
    if (!html) continue;
    if (heeftOnlineOfferte(html)) calculator = true;
    email ??= pickEmail(html, base.hostname);
    const wa = pickWhatsapp(html);
    // Een nummer gaat voor "ja".
    if (wa && (!whatsapp || whatsapp === "ja")) whatsapp = wa;
    // Zodra er een calculator is gevonden hoeven we niet verder te zoeken.
    if (calculator) break;
  }
  return { email, whatsapp, calculator };
}

/** Voor een lijst websites, max. `concurrency` tegelijk. */
export async function scanWebsites(
  websites: (string | null)[],
  concurrency = 5,
): Promise<SiteScan[]> {
  const out: SiteScan[] = websites.map(() => ({ email: null, whatsapp: null, calculator: false }));
  let next = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < websites.length) {
        const i = next++;
        const w = websites[i];
        if (w) out[i] = await scanWebsite(w);
      }
    }),
  );
  return out;
}
