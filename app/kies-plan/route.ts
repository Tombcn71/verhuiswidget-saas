import { NextResponse, type NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  getOrCreateCompany,
  updateCompanySettings,
  normalizeServiceType,
} from "@/lib/companies";

/**
 * Landt hier vanaf de pricing-knop "Kies …". Zet de gekozen dienst op het bedrijf
 * (maakt 't aan als het nog niet bestaat) en stuurt door naar het dashboard.
 * Niet ingelogd → eerst registreren, daarna komt Clerk hier terug.
 */
export async function GET(req: NextRequest) {
  const dienst = normalizeServiceType(req.nextUrl.searchParams.get("dienst"));
  const origin = req.nextUrl.origin;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(
      new URL(`/registreren?dienst=${dienst}`, origin),
    );
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    "onbekend@example.com";
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  const company = await getOrCreateCompany({
    clerkUserId: userId,
    email,
    name,
    serviceType: dienst,
  });
  if (company.serviceType !== dienst) {
    await updateCompanySettings(company.id, { serviceType: dienst });
  }

  return NextResponse.redirect(new URL("/dashboard", origin));
}
