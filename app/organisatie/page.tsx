import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { OrganizationList } from "@clerk/nextjs";
import { Logo } from "@/app/_components/logo";
import { ensureLegacyOrganization } from "@/lib/companies";
import { normalizePlan } from "@/lib/plans";

export const metadata: Metadata = { title: "Kies je bedrijf" };

/**
 * Landt hier wie ingelogd is zonder actieve organisatie: een bestaand bedrijf
 * kiezen, of een nieuw bedrijf (organisatie) aanmaken. `?plan=` van de
 * pricing-knop reist mee naar /kies-plan.
 */
export default async function OrganizationPage({ searchParams }: PageProps<"/organisatie">) {
  const { userId } = await auth();
  if (!userId) redirect("/inloggen");

  // Oude accounts: eerst hun bestaande bedrijf in een organisatie zetten.
  await ensureLegacyOrganization(userId);

  const { plan } = await searchParams;
  const next =
    typeof plan === "string" ? `/kies-plan?plan=${normalizePlan(plan)}` : "/dashboard";

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-50 px-6 py-16">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      {/* Geen uitnodigscherm direct na aanmaken: het plan (en dus het aantal
          gebruikers) staat pas vast als het bedrijf in de app bestaat. */}
      <OrganizationList
        hidePersonal
        skipInvitationScreen
        afterSelectOrganizationUrl={next}
        afterCreateOrganizationUrl={next}
      />
    </div>
  );
}
