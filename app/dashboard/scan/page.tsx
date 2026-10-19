import type { Metadata } from "next";
import { PageHeader } from "../page-header";
import { redirect } from "next/navigation";
import { requireCompany } from "@/lib/current-company";
import { hasAccess } from "@/lib/plans";
import { normalizeServiceType } from "@/lib/companies";
import { Widget } from "@/app/widget/[companyId]/widget";

export const metadata: Metadata = { title: "Scannen" };

/**
 * Onspot: de verhuizer loopt zelf met de telefoon door de woning van de klant.
 * Dezelfde flow als de widget, maar de lead krijgt het kanaal "onspot" en telt
 * gewoon mee als offerteaanvraag.
 */
export default async function ScanPage() {
  const company = await requireCompany();
  if (!hasAccess(company)) redirect("/dashboard/abonnement");

  return (
    <div>
      <PageHeader
        title="Scannen"
        description="Bij de klant op locatie? Maak per kamer foto's, check de inboedel en maak direct de offerte. Die komt bij je leads en gaat per mail naar de klant."
      />

      <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border bg-background shadow-lg">
        <Widget
          source="onspot"
          company={{
            id: company.id,
            name: company.name,
            logoUrl: company.logoUrl,
            primaryColor: company.primaryColor,
            phone: company.phone,
            serviceType: normalizeServiceType(company.serviceType),
          }}
        />
      </div>
    </div>
  );
}
