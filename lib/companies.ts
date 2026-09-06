import { eq } from "drizzle-orm";
import { db, companies, type Company } from "@/lib/db";
import { DEMO_CLERK_ID, DEMO_COMPANY_ID, DEMO_COMPANY_PUBLIC } from "@/lib/demo";

export async function getCompanyByClerkId(clerkUserId: string): Promise<Company | null> {
  const [row] = await db
    .select()
    .from(companies)
    .where(eq(companies.clerkUserId, clerkUserId))
    .limit(1);
  return row ?? null;
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const [row] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return row ?? null;
}

/**
 * Haalt de verhuizer op die bij dit Clerk-account hoort, of maakt 'm aan bij
 * eerste login (onboarding).
 */
export type ServiceType = "verhuizen" | "ontruimen" | "beide";

export function normalizeServiceType(value: unknown): ServiceType {
  return value === "verhuizen" || value === "ontruimen" ? value : "beide";
}

/**
 * Haalt het bedrijf op dat bij dit Clerk-account hoort, of maakt 'm aan bij
 * eerste login (onboarding). `serviceType` wordt alleen bij het aanmaken gezet.
 */
export async function getOrCreateCompany(input: {
  clerkUserId: string;
  email: string;
  name?: string;
  serviceType?: ServiceType;
}): Promise<Company> {
  const existing = await getCompanyByClerkId(input.clerkUserId);
  if (existing) return existing;

  const [created] = await db
    .insert(companies)
    .values({
      clerkUserId: input.clerkUserId,
      email: input.email,
      name: input.name?.trim() || "Mijn bedrijf",
      serviceType: normalizeServiceType(input.serviceType),
    })
    .onConflictDoNothing({ target: companies.clerkUserId })
    .returning();

  if (created) return created;

  // Race: iemand anders maakte 'm net aan.
  const row = await getCompanyByClerkId(input.clerkUserId);
  if (!row) throw new Error("Kon verhuizer niet aanmaken.");
  return row;
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
