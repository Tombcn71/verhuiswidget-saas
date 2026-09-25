import { and, eq, isNull } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { db, companies, type Company } from "@/lib/db";
import { DEMO_CLERK_ID, DEMO_COMPANY_ID, DEMO_COMPANY_PUBLIC } from "@/lib/demo";
import { seatLimit, type PlanId } from "@/lib/plans";
import type { SubscriptionStatus } from "@/lib/stripe";

export async function getCompanyByOrgId(clerkOrgId: string): Promise<Company | null> {
  const [row] = await db
    .select()
    .from(companies)
    .where(eq(companies.clerkOrgId, clerkOrgId))
    .limit(1);
  return row ?? null;
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const [row] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return row ?? null;
}

export type ServiceType = "verhuizen" | "ontruimen" | "beide";

export function normalizeServiceType(value: unknown): ServiceType {
  return value === "verhuizen" || value === "ontruimen" ? value : "beide";
}

/**
 * Haalt het bedrijf op dat bij deze Clerk-organisatie hoort, of maakt 'm aan
 * bij het eerste bezoek van het team (onboarding). De bedrijfsnaam komt van de
 * organisatie.
 */
export async function getOrCreateCompany(input: {
  clerkOrgId: string;
  clerkUserId: string;
  email: string;
}): Promise<Company> {
  const existing = await getCompanyByOrgId(input.clerkOrgId);
  if (existing) return existing;

  const client = await clerkClient();
  const org = await client.organizations.getOrganization({
    organizationId: input.clerkOrgId,
  });

  // Eén proefperiode per gebruiker: wie al eerder een bedrijf aanmaakte, begint
  // meteen zonder proef (anders kun je eindeloos gratis blijven).
  const [earlier] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.clerkUserId, input.clerkUserId))
    .limit(1);

  const [created] = await db
    .insert(companies)
    .values({
      clerkOrgId: input.clerkOrgId,
      clerkUserId: input.clerkUserId,
      email: input.email,
      name: org.name.trim() || "Mijn bedrijf",
      ...(earlier ? { trialEndsAt: new Date() } : {}),
    })
    .onConflictDoNothing({ target: companies.clerkOrgId })
    .returning();

  if (created) {
    await syncSeatLimit(created);
    return created;
  }

  // Race: een teamgenoot maakte 'm net aan.
  const row = await getCompanyByOrgId(input.clerkOrgId);
  if (!row) throw new Error("Kon verhuizer niet aanmaken.");
  return row;
}

/**
 * Accounts van vóór de organisaties hebben een bedrijf zonder `clerkOrgId`.
 * Maakt daar een organisatie voor aan (de gebruiker wordt admin) en koppelt
 * 'm, zodat het bedrijf verschijnt in de organisatiekeuze. Idempotent.
 */
export async function ensureLegacyOrganization(clerkUserId: string): Promise<void> {
  const [legacy] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.clerkUserId, clerkUserId), isNull(companies.clerkOrgId)))
    .limit(1);
  if (!legacy) return;

  const client = await clerkClient();
  const org = await client.organizations.createOrganization({
    name: legacy.name,
    createdBy: clerkUserId,
    maxAllowedMemberships: seatLimit(legacy),
  });
  await db
    .update(companies)
    .set({ clerkOrgId: org.id, updatedAt: new Date() })
    .where(eq(companies.id, legacy.id));
}

/**
 * Zet het maximum aantal teamleden van de Clerk-organisatie gelijk aan het plan.
 * Aanroepen na aanmaken en na elke plan- of seatwijziging.
 */
export async function syncSeatLimit(company: Company): Promise<void> {
  if (!company.clerkOrgId) return;
  const client = await clerkClient();
  await client.organizations.updateOrganization(company.clerkOrgId, {
    maxAllowedMemberships: seatLimit(company),
  });
}

/** Aantal teamleden van de organisatie (voor "2 / 3 gebruikers"). */
export async function countMembers(company: Company): Promise<number> {
  if (!company.clerkOrgId) return 1;
  const client = await clerkClient();
  const org = await client.organizations.getOrganization({
    organizationId: company.clerkOrgId,
    includeMembersCount: true,
  });
  return org.membersCount ?? 1;
}

let demoCompany: Company | null = null;

/**
 * Maakt de demo-verhuizer aan bij eerste gebruik en geeft 'm terug.
 * Gebruikt door de publieke demo-widget op de landing.
 */
export async function ensureDemoCompany(): Promise<Company> {
  if (demoCompany) return demoCompany;

  const existing = await getCompanyById(DEMO_COMPANY_ID);
  if (existing) return (demoCompany = existing);

  const [created] = await db
    .insert(companies)
    .values({
      id: DEMO_COMPANY_ID,
      clerkUserId: DEMO_CLERK_ID,
      name: DEMO_COMPANY_PUBLIC.name,
      email: "demo@moverai.example",
      primaryColor: DEMO_COMPANY_PUBLIC.primaryColor,
      serviceType: "beide",
    })
    .onConflictDoNothing()
    .returning();
  if (created) return (demoCompany = created);

  // Race: iemand anders maakte 'm net aan.
  const row = await getCompanyById(DEMO_COMPANY_ID);
  if (!row) throw new Error("Kon de demo-verhuizer niet aanmaken.");
  return (demoCompany = row);
}

export type CompanySettingsInput = Partial<
  Pick<
    Company,
    | "name"
    | "email"
    | "phone"
    | "website"
    | "logoUrl"
    | "primaryColor"
    | "serviceType"
    | "ontruimenTariffs"
    | "moveFloorSurchargeCents"
    | "liftFeeCents"
    | "baseFeeCents"
    | "pricePerM3Cents"
    | "pricePerKmCents"
    | "hourlyRatePerMoverCents"
    | "m3PerHourPerMover"
    | "truckCapacityM3"
    | "truckAccessSurchargeCents"
    | "rushSurchargeCents"
    | "packingFeeCents"
    | "assemblyFeeCents"
    | "storagePerMonthCents"
    | "minPriceCents"
  >
>;

export async function updateCompanySettings(
  id: string,
  values: CompanySettingsInput,
): Promise<Company> {
  const [row] = await db
    .update(companies)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(companies.id, id))
    .returning();
  return row;
}

/** Wisselt van plan en past de gebruikerslimiet in Clerk mee aan. */
export async function setCompanyPlan(id: string, plan: PlanId): Promise<Company> {
  const [row] = await db
    .update(companies)
    .set({ plan, updatedAt: new Date() })
    .where(eq(companies.id, id))
    .returning();
  await syncSeatLimit(row);
  return row;
}

export async function getCompanyByStripeCustomerId(customerId: string): Promise<Company | null> {
  const [row] = await db
    .select()
    .from(companies)
    .where(eq(companies.stripeCustomerId, customerId))
    .limit(1);
  return row ?? null;
}

export async function setStripeCustomerId(id: string, customerId: string): Promise<void> {
  await db
    .update(companies)
    .set({ stripeCustomerId: customerId, updatedAt: new Date() })
    .where(eq(companies.id, id));
}

/**
 * Verwerkt de stand van een Stripe-abonnement (vanuit de webhook) op het bedrijf
 * en past de gebruikerslimiet in Clerk mee aan.
 */
export async function applySubscription(
  id: string,
  values: {
    plan?: PlanId;
    subscriptionStatus: SubscriptionStatus;
    stripeSubscriptionId: string | null;
    extraSeats: number;
  },
): Promise<void> {
  const [row] = await db
    .update(companies)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(companies.id, id))
    .returning();
  if (row) await syncSeatLimit(row);
}
