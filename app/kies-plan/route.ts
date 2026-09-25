import { NextResponse, type NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getOrCreateCompany, setCompanyPlan } from "@/lib/companies";
import { normalizePlan, trialState } from "@/lib/plans";

/**
 * Landt hier vanaf de pricing-knop "Probeer … gratis". Het begin van de flow:
 * niet ingelogd → registreren; geen bedrijf → bedrijf aanmaken; daarna komt
 * Clerk hier terug en zetten we het gekozen plan (tijdens de proef) op het bedrijf.
 */
export async function GET(req: NextRequest) {
  const plan = normalizePlan(req.nextUrl.searchParams.get("plan"));
  const origin = req.nextUrl.origin;

  const { userId, orgId, has } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL(`/registreren?plan=${plan}`, origin));
  }
  if (!orgId) {
    return NextResponse.redirect(new URL(`/organisatie?plan=${plan}`, origin));
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    "onbekend@example.com";

  const company = await getOrCreateCompany({ clerkOrgId: orgId, clerkUserId: userId, email });

  // Wisselen van plan mag alleen een admin, en zonder Stripe alleen tijdens de proef.
  // Anders gewoon door naar het abonnementsoverzicht.
  if (company.plan !== plan) {
    if (!has({ role: "org:admin" }) || trialState(company).kind !== "trial") {
      return NextResponse.redirect(new URL("/dashboard/abonnement", origin));
    }
    await setCompanyPlan(company.id, plan);
  }

  return NextResponse.redirect(new URL("/dashboard", origin));
}
