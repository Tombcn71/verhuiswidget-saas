import { del, list } from "@vercel/blob";
import { and, lt, sql } from "drizzle-orm";
import { db, leads } from "@/lib/db";

/** Foto's van klanten worden na deze termijn automatisch verwijderd (AVG). */
export const PHOTO_RETENTION_MONTHS = 3;

/**
 * Verwijdert widgetfoto's ouder dan de bewaartermijn uit Vercel Blob, ook die van
 * afgebroken aanvragen, en haalt de links weg bij de leads. De lead zelf blijft.
 * Met `dryRun` wordt alleen geteld. Logo's staan buiten `widget/` en blijven staan.
 */
export async function deleteExpiredPhotos({ dryRun = false } = {}): Promise<{
  blobs: number;
  leads: number;
}> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { blobs: 0, leads: 0 };
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - PHOTO_RETENTION_MONTHS);

  const expired: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "widget/", cursor, limit: 1000 });
    for (const b of page.blobs) if (b.uploadedAt < cutoff) expired.push(b.url);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const withPhotos = and(
    lt(leads.createdAt, cutoff),
    sql`jsonb_array_length(${leads.photoUrls}) > 0`,
  );

  if (dryRun) {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(leads)
      .where(withPhotos);
    return { blobs: expired.length, leads: n };
  }

  for (let i = 0; i < expired.length; i += 500) await del(expired.slice(i, i + 500));
  const cleared = await db
    .update(leads)
    .set({ photoUrls: [] })
    .where(withPhotos)
    .returning({ id: leads.id });
  return { blobs: expired.length, leads: cleared.length };
}
