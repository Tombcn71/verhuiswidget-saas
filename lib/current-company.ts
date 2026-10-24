import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getOrCreateCompany, syncSeatLimit } from "@/lib/companies";
import { seatLimit } from "@/lib/plans";
import type { Company } from "@/lib/db";

/**
 * Haalt het bedrijf op van de actieve Clerk-organisatie van de ingelogde gebruiker.
 * Geen sessie → /inloggen; geen actieve organisatie → /organisatie (kiezen of aanmaken).
 */
export async function requireCompany(): Promise<Company> {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/inloggen");
  if (!orgId) redirect("/organisatie");

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    "onbekend@example.com";

  const company = await getOrCreateCompany({ clerkOrgId: orgId, clerkUserId: userId, email });

  // Gebruikerslimiet in Clerk gelijk houden met het plan (bijv. na een
  // prijswijziging van 1/3/5 naar 2/5/10). Alleen een API-call als het afwijkt.
  if (company.clerkSeatLimit !== seatLimit(company)) {
    await syncSeatLimit(company).catch((err) =>
      console.error("Gebruikerslimiet bijwerken mislukt", err),
    );
  }
  return company;
}

/** Of de ingelogde gebruiker admin is van de actieve organisatie. */
export async function isOrgAdmin(): Promise<boolean> {
  const { has } = await auth();
  return has({ role: "org:admin" });
}

/**
 * Zoals `requireCompany`, maar alleen voor admins (tarieven, bedrijfsgegevens).
 * Gewone teamleden gaan terug naar het overzicht.
 */
export async function requireAdminCompany(): Promise<Company> {
  const company = await requireCompany();
  if (!(await isOrgAdmin())) redirect("/dashboard");
  return company;
}
