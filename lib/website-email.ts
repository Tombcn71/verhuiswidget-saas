/**
 * Zoekt een e-mailadres op de website van een bedrijf (homepage, anders de
 * contactpagina). Gebruikt bij het ophalen van verhuisbedrijven via Google.
 */

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
// Geen plaatjes ("logo@2x.png") of adressen van websitebouwers/trackers.
const IGNORE = /\.(png|jpe?g|gif|svg|webp)$|@(example|sentry|wixpress|domain|email)\.|^(noreply|no-reply)@/i;

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

export async function findEmailOnWebsite(website: string): Promise<string | null> {
  let base: URL;
  try {
    base = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
  } catch {
    return null;
  }
  for (const path of ["", "/contact", "/contact/", "/over-ons"]) {
    const html = await fetchHtml(new URL(path || base.pathname, base).toString());
    const email = html && pickEmail(html, base.hostname);
    if (email) return email;
  }
  return null;
}

/** Voor een lijst websites, max. `concurrency` tegelijk. */
export async function findEmails(
  websites: (string | null)[],
  concurrency = 5,
): Promise<(string | null)[]> {
  const out: (string | null)[] = new Array(websites.length).fill(null);
  let next = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < websites.length) {
        const i = next++;
        const w = websites[i];
        if (w) out[i] = await findEmailOnWebsite(w);
      }
    }),
  );
  return out;
}
