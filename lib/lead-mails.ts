import { and, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { companies, db, leads } from "@/lib/db";
import { bookingUrl } from "@/lib/leads";
import { hasAccess } from "@/lib/plans";
import { sendQuoteFollowUp, sendReviewRequest } from "@/lib/email";

/**
 * Automatische mails aan klanten van de verhuizer, één keer per dag via
 * /api/cron/lead-mails:
 * 1. Opvolging: 2–7 dagen na de offerte nog niet geboekt → één herinnering.
 * 2. Review: 1–7 dagen na de verhuisdatum van een geboekte klus → reviewverzoek.
 * Elke mail hooguit één keer per lead; alleen voor bedrijven met een actief plan.
 */

const today = sql`(now() at time zone 'Europe/Amsterdam')::date`;

export async function sendDueFollowUps(): Promise<number> {
  const rows = await db
    .select({ lead: leads, company: companies })
    .from(leads)
    .innerJoin(companies, eq(leads.companyId, companies.id))
    .where(
      and(
        eq(companies.quoteFollowUp, true),
        inArray(leads.status, ["nieuw", "gecontacteerd"]),
        isNull(leads.acceptedAt),
        isNull(leads.followUpSentAt),
        isNotNull(leads.acceptToken),
        sql`${leads.createdAt} <= now() - interval '2 days'`,
        sql`${leads.createdAt} > now() - interval '7 days'`,
        sql`(${leads.moveDate} is null or ${leads.moveDate} > ${today})`,
      ),
    );

  let sent = 0;
  for (const { lead, company } of rows) {
    const acceptUrl = bookingUrl(lead);
    if (!acceptUrl || !hasAccess(company)) continue;
    const res = await sendQuoteFollowUp({
      company,
      customerName: lead.customerName,
      customerEmail: lead.customerEmail,
      moveType: lead.moveType,
      moveDate: lead.moveDate,
      totalCents: lead.totalCents,
      acceptUrl,
    });
    if (!res.sent) continue;
    await db.update(leads).set({ followUpSentAt: new Date() }).where(eq(leads.id, lead.id));
    sent++;
  }
  return sent;
}

export async function sendDueReviewRequests(): Promise<number> {
  const rows = await db
    .select({ lead: leads, company: companies })
    .from(leads)
    .innerJoin(companies, eq(leads.companyId, companies.id))
    .where(
      and(
        isNotNull(companies.googleReviewUrl),
        inArray(leads.status, ["akkoord", "gewonnen"]),
        isNull(leads.reviewRequestSentAt),
        sql`${leads.moveDate} < ${today}`,
        sql`${leads.moveDate} >= ${today} - 7`,
      ),
    );

  let sent = 0;
  for (const { lead, company } of rows) {
    if (!company.googleReviewUrl || !hasAccess(company)) continue;
    const res = await sendReviewRequest({
      company,
      customerName: lead.customerName,
      customerEmail: lead.customerEmail,
      moveType: lead.moveType,
      reviewUrl: company.googleReviewUrl,
    });
    if (!res.sent) continue;
    await db.update(leads).set({ reviewRequestSentAt: new Date() }).where(eq(leads.id, lead.id));
    sent++;
  }
  return sent;
}
