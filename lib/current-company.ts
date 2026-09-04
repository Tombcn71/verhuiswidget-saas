import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getOrCreateCompany } from "@/lib/companies";
import type { Company } from "@/lib/db";

/**
 * Haalt het bedrijf op dat bij de ingelogde gebruiker hoort.
 * Redirect naar /inloggen als er geen sessie is.
 * De dienstkeuze uit een pricing-plan komt via /kies-plan binnen, niet hier.
 */
export async function requireCompany(): Promise<Company> {
  const { userId } = await auth();
  if (!userId) redirect("/inloggen");

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    "onbekend@example.com";
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return getOrCreateCompany({ clerkUserId: userId, email, name });
}
