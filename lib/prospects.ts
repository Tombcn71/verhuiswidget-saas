import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { adminState, db, prospects, type NewProspect, type Prospect } from "@/lib/db";
import { NL_CITIES, searchMovers } from "@/lib/places";
import { findEmails } from "@/lib/website-email";
import { appUrl } from "@/lib/app-url";

/** Fases in de verkoop-pijplijn van moverAI, in volgorde. */
export const STAGES = [
  { key: "nieuw", label: "Nieuw" },
  { key: "gebeld", label: "Gebeld" },
  { key: "demo_gestuurd", label: "Demo gestuurd" },
  { key: "demo_gedaan", label: "Demo gedaan" },
  { key: "proef", label: "Proef gestart" },
  { key: "klant", label: "Klant" },
  { key: "afgevallen", label: "Afgevallen" },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];

export function isStage(value: unknown): value is StageKey {
  return STAGES.some((s) => s.key === value);
}

export function stageLabel(key: string): string {
  return STAGES.find((s) => s.key === key)?.label ?? key;
}

/** "Jansen Verhuizingen B.V." → "jansen-verhuizingen-bv" */
function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "verhuizer"
  );
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  const taken = await db
    .select({ slug: prospects.slug })
    .from(prospects)
    .where(sql`${prospects.slug} = ${base} or ${prospects.slug} like ${base + "-%"}`);
  const set = new Set(taken.map((t) => t.slug));
  if (!set.has(base)) return base;
  for (let i = 2; ; i++) if (!set.has(`${base}-${i}`)) return `${base}-${i}`;
}

export function demoLinkFor(p: Pick<Prospect, "slug">): string {
  return `${appUrl()}/demo/${p.slug}`;
}

// --- Lijst inlezen (geplakt uit Excel/Google Sheets of CSV) -----------------

const COLUMN_ALIASES: Record<string, keyof NewProspect> = {
  bedrijf: "companyName",
  bedrijfsnaam: "companyName",
  naam: "companyName",
  company: "companyName",
  contact: "contactName",
  contactpersoon: "contactName",
  telefoon: "phone",
  tel: "phone",
  telefoonnummer: "phone",
  mobiel: "phone",
  phone: "phone",
  email: "email",
  "e-mail": "email",
  mail: "email",
  website: "website",
  site: "website",
  plaats: "city",
  stad: "city",
  woonplaats: "city",
  city: "city",
  notitie: "notes",
  notities: "notes",
  opmerking: "notes",
  opmerkingen: "notes",
};

export type ImportRow = Pick<
  NewProspect,
  "companyName" | "contactName" | "phone" | "email" | "website" | "city" | "notes"
>;

/**
 * Leest een geplakte tabel. Eerste regel = kolomnamen (bijv. Bedrijf, Telefoon,
 * Plaats). Scheidingsteken: tab (Excel/Sheets), puntkomma of komma.
 */
export function parseProspectTable(text: string): { rows: ImportRow[]; unknownColumns: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], unknownColumns: [] };
  const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const split = (l: string) => l.split(sep).map((c) => c.trim().replace(/^"(.*)"$/, "$1"));

  const header = split(lines[0]).map((h) => h.toLowerCase());
  const fields = header.map((h) => COLUMN_ALIASES[h] ?? null);
  const unknownColumns = header.filter((_, i) => !fields[i]);

  const rows: ImportRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = split(line);
    const row: Partial<ImportRow> = {};
    fields.forEach((f, i) => {
      const v = cells[i]?.trim();
      if (f && v) (row as Record<string, string>)[f] = v;
    });
    if (row.companyName) rows.push(row as ImportRow);
  }
  return { rows, unknownColumns };
}

/** Telefoonnummer zonder opmaak, om dubbelen te herkennen ("06-123 45678" = "0612345678"). */
const phoneKey = (p: string | null | undefined) => (p ?? "").replace(/\D/g, "").replace(/^31/, "0");
const nameKey = (n: string) => n.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Grote lijsten in één keer: bestaande namen/nummers en links één keer ophalen,
 * dubbelen overslaan (zelfde naam of zelfde telefoonnummer, ook binnen de lijst)
 * en in blokken van 500 opslaan.
 */
export async function importProspects(
  rows: ImportRow[],
): Promise<{ added: number; skipped: number }> {
  const existing = await db
    .select({ slug: prospects.slug, name: prospects.companyName, phone: prospects.phone })
    .from(prospects);
  const slugs = new Set(existing.map((e) => e.slug));
  const names = new Set(existing.map((e) => nameKey(e.name)));
  const phones = new Set(existing.map((e) => phoneKey(e.phone)).filter(Boolean));

  const toInsert: NewProspect[] = [];
  let skipped = 0;
  for (const row of rows) {
    const n = nameKey(row.companyName);
    const ph = phoneKey(row.phone);
    if (names.has(n) || (ph && phones.has(ph))) {
      skipped++;
      continue;
    }
    names.add(n);
    if (ph) phones.add(ph);

    const base = slugify(row.companyName);
    let slug = base;
    for (let i = 2; slugs.has(slug); i++) slug = `${base}-${i}`;
    slugs.add(slug);
    toInsert.push({ ...row, slug });
  }

  for (let i = 0; i < toInsert.length; i += 500) {
    await db.insert(prospects).values(toInsert.slice(i, i + 500));
  }
  return { added: toInsert.length, skipped };
}

export async function createProspect(row: ImportRow): Promise<Prospect> {
  const [p] = await db
    .insert(prospects)
    .values({ ...row, slug: await uniqueSlug(row.companyName) })
    .returning();
  return p;
}

export async function listProspects(): Promise<Prospect[]> {
  return db
    .select()
    .from(prospects)
    .orderBy(asc(prospects.nextActionOn), desc(prospects.updatedAt), asc(prospects.companyName));
}

export async function getProspect(id: string): Promise<Prospect | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [p] = await db.select().from(prospects).where(eq(prospects.id, id)).limit(1);
  return p ?? null;
}

export async function getProspectBySlug(slug: string): Promise<Prospect | null> {
  const [p] = await db.select().from(prospects).where(eq(prospects.slug, slug)).limit(1);
  return p ?? null;
}

export async function updateProspect(id: string, values: Partial<NewProspect>): Promise<void> {
  await db
    .update(prospects)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(prospects.id, id));
}

export async function deleteProspect(id: string): Promise<void> {
  await db.delete(prospects).where(eq(prospects.id, id));
}

// --- Automatisch bijgehouden via de demolink --------------------------------

/** Fases die automatisch vooruit mogen; latere fases (proef, klant) blijven staan. */
const BEFORE_DEMO: StageKey[] = ["nieuw", "gebeld", "demo_gestuurd"];

export async function markDemoSent(id: string): Promise<void> {
  await db
    .update(prospects)
    .set({ demoSentAt: new Date(), updatedAt: new Date() })
    .where(eq(prospects.id, id));
  await db
    .update(prospects)
    .set({ stage: "demo_gestuurd" })
    .where(and(eq(prospects.id, id), inArray(prospects.stage, ["nieuw", "gebeld"])));
}

/** Eerste keer dat de demolink geopend wordt. */
export async function markDemoOpened(slug: string): Promise<void> {
  await db
    .update(prospects)
    .set({ demoOpenedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(prospects.slug, slug), isNull(prospects.demoOpenedAt)));
}

/** Demo afgerond (offerte aangevraagd): fase → "Demo gedaan". */
export async function markDemoCompleted(slug: string): Promise<void> {
  await db
    .update(prospects)
    .set({ demoCompletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(prospects.slug, slug), isNull(prospects.demoCompletedAt)));
  await db
    .update(prospects)
    .set({ stage: "demo_gedaan" })
    .where(and(eq(prospects.slug, slug), inArray(prospects.stage, BEFORE_DEMO)));
}

/** Klikte op "Ja, ik wil boeken" in de demo: warmste signaal. */
export async function markDemoBooked(slug: string): Promise<void> {
  await db
    .update(prospects)
    .set({ demoBookedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(prospects.slug, slug), isNull(prospects.demoBookedAt)));
}

// --- Nieuwe verhuisbedrijven ophalen via Google Places ----------------------

type PlacesCursor = { cityIndex: number; pageToken: string | null };
const CURSOR_KEY = "places_cursor";

async function readCursor(): Promise<PlacesCursor> {
  const [row] = await db.select().from(adminState).where(eq(adminState.key, CURSOR_KEY)).limit(1);
  const v = row?.value as Partial<PlacesCursor> | undefined;
  return { cityIndex: v?.cityIndex ?? 0, pageToken: v?.pageToken ?? null };
}

async function writeCursor(cursor: PlacesCursor): Promise<void> {
  await db
    .insert(adminState)
    .values({ key: CURSOR_KEY, value: cursor })
    .onConflictDoUpdate({ target: adminState.key, set: { value: cursor, updatedAt: new Date() } });
}

/** Welke plaats de volgende automatische ophaalronde doet (voor in de CRM). */
export async function nextPlacesCity(): Promise<string | null> {
  const c = await readCursor();
  return NL_CITIES[c.cityIndex] ?? null;
}

/**
 * Haalt `count` nieuwe verhuisbedrijven op en voegt ze toe als "Nieuw".
 * Dubbelen (zelfde Google-ID, naam of telefoonnummer) worden overgeslagen; er
 * wordt doorgezocht tot er genoeg nieuwe zijn. Zonder `city` worden de plaatsen
 * uit NL_CITIES afgewerkt en onthoudt de app waar hij was gebleven.
 */
export async function fetchNewProspects(input: {
  count: number;
  city?: string | null;
}): Promise<{ added: number; skipped: number; cities: string[]; done: boolean }> {
  const existing = await db
    .select({ placeId: prospects.placeId, name: prospects.companyName, phone: prospects.phone, slug: prospects.slug })
    .from(prospects);
  const placeIds = new Set(existing.map((e) => e.placeId).filter(Boolean));
  const names = new Set(existing.map((e) => nameKey(e.name)));
  const phones = new Set(existing.map((e) => phoneKey(e.phone)).filter(Boolean));
  const slugs = new Set(existing.map((e) => e.slug));

  const manual = input.city?.trim() || null;
  let cursor: PlacesCursor = manual ? { cityIndex: -1, pageToken: null } : await readCursor();
  const toInsert: NewProspect[] = [];
  const cities = new Set<string>();
  let skipped = 0;
  let done = false;

  // Max. 10 zoekopdrachten per klik: houdt de kosten voorspelbaar.
  for (let calls = 0; calls < 10 && toInsert.length < input.count; calls++) {
    const city = manual ?? NL_CITIES[cursor.cityIndex];
    if (!city) {
      done = true; // alle plaatsen gehad
      break;
    }
    cities.add(city);
    const { places, nextPageToken } = await searchMovers(city, cursor.pageToken);

    for (const p of places) {
      if (toInsert.length >= input.count) break;
      const n = nameKey(p.name);
      const ph = phoneKey(p.phone);
      if (placeIds.has(p.placeId) || names.has(n) || (ph && phones.has(ph))) {
        skipped++;
        continue;
      }
      placeIds.add(p.placeId);
      names.add(n);
      if (ph) phones.add(ph);
      const base = slugify(p.name);
      let slug = base;
      for (let i = 2; slugs.has(slug); i++) slug = `${base}-${i}`;
      slugs.add(slug);
      toInsert.push({
        slug,
        companyName: p.name,
        phone: p.phone,
        website: p.website,
        city: p.city ?? (manual ? null : city),
        address: p.address,
        placeId: p.placeId,
        rating: p.rating,
        reviewCount: p.reviewCount,
      });
    }

    // Volgende pagina van deze plaats, of door naar de volgende plaats.
    if (nextPageToken) {
      cursor = { ...cursor, pageToken: nextPageToken };
    } else if (manual) {
      done = true;
      break;
    } else {
      cursor = { cityIndex: cursor.cityIndex + 1, pageToken: null };
    }
  }

  // E-mailadres van hun website halen (voor "Demo mailen"); gratis, geen Google-zoekopdracht.
  const emails = await findEmails(toInsert.map((p) => p.website ?? null));
  toInsert.forEach((p, i) => {
    if (emails[i]) p.email = emails[i];
  });

  if (toInsert.length) await db.insert(prospects).values(toInsert);
  if (!manual) await writeCursor(cursor);
  return { added: toInsert.length, skipped, cities: [...cities], done };
}
