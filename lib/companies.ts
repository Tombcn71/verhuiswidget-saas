import { eq } from "drizzle-orm";
import { db, companies, type Company } from "@/lib/db";

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
export async function getOrCreateCompany(input: {
  clerkUserId: string;
  email: string;
  name?: string;
}): Promise<Company> {
  const existing = await getCompanyByClerkId(input.clerkUserId);
  if (existing) return existing;

  const [created] = await db
    .insert(companies)
    .values({
      clerkUserId: input.clerkUserId,
      email: input.email,
      name: input.name?.trim() || "Mijn verhuisbedrijf",
    })
    .onConflictDoNothing({ target: companies.clerkUserId })
    .returning();

  if (created) return created;

  // Race: iemand anders maakte 'm net aan.
  const row = await getCompanyByClerkId(input.clerkUserId);
  if (!row) throw new Error("Kon verhuizer niet aanmaken.");
  return row;
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
    | "baseFeeCents"
    | "pricePerM3Cents"
    | "pricePerKmCents"
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
