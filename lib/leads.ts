import { and, desc, eq, sql } from "drizzle-orm";
import { db, leads, type Lead, type NewLead } from "@/lib/db";

export async function createLead(values: NewLead): Promise<Lead> {
  const [row] = await db.insert(leads).values(values).returning();
  return row;
}

export async function listLeadsForCompany(
  companyId: string,
  limit = 100,
  moveType?: "verhuizing" | "ontruiming",
): Promise<Lead[]> {
  return db
    .select()
    .from(leads)
    .where(
      moveType
        ? and(eq(leads.companyId, companyId), eq(leads.moveType, moveType))
        : eq(leads.companyId, companyId),
    )
    .orderBy(desc(leads.createdAt))
    .limit(limit);
}

export async function getLeadForCompany(
  companyId: string,
  leadId: string,
): Promise<Lead | null> {
  const [row] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.companyId, companyId), eq(leads.id, leadId)))
    .limit(1);
  return row ?? null;
}

export async function updateLeadStatus(
  companyId: string,
  leadId: string,
  status: string,
): Promise<void> {
  await db
    .update(leads)
    .set({ status })
    .where(and(eq(leads.companyId, companyId), eq(leads.id, leadId)));
}

export type LeadStats = {
  total: number;
  last30Days: number;
  pipelineValueCents: number;
  wonValueCents: number;
  verhuizingen: number;
  ontruimingen: number;
};

export async function getLeadStats(companyId: string): Promise<LeadStats> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      last30Days: sql<number>`count(*) filter (where ${leads.createdAt} >= ${cutoff})::int`,
      pipelineValueCents: sql<number>`coalesce(sum(${leads.totalCents}) filter (where ${leads.status} in ('nieuw','gecontacteerd')), 0)::int`,
      wonValueCents: sql<number>`coalesce(sum(${leads.totalCents}) filter (where ${leads.status} = 'gewonnen'), 0)::int`,
      verhuizingen: sql<number>`count(*) filter (where ${leads.moveType} = 'verhuizing')::int`,
      ontruimingen: sql<number>`count(*) filter (where ${leads.moveType} = 'ontruiming')::int`,
    })
    .from(leads)
    .where(eq(leads.companyId, companyId));

  return (
    row ?? {
      total: 0,
      last30Days: 0,
      pipelineValueCents: 0,
      wonValueCents: 0,
      verhuizingen: 0,
      ontruimingen: 0,
    }
  );
}
