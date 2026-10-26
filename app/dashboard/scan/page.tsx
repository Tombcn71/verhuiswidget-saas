import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireCompany } from "@/lib/current-company";
import { hasAccess } from "@/lib/plans";
import { normalizeServiceType } from "@/lib/companies";
import { Widget } from "@/app/widget/[companyId]/widget";

export const metadata: Metadata = { title: "Scannen" };

/**
 * Onspot: de verhuizer loopt zelf met de telefoon door de woning van de klant.
 * Dezelfde flow als de widget, maar de lead krijgt het kanaal "onspot" en telt
 * gewoon mee als offerteaanvraag. Schermvullend over het dashboard heen (geen
 * zijbalk, WhatsApp- of feedbackknop), zodat de knop onderin altijd in beeld is;
 * het terugpijltje gaat naar het dashboard.
 */
export default async function ScanPage() {
  const company = await requireCompany();
  if (!hasAccess(company)) redirect("/dashboard/abonnement");

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden overscroll-none bg-white">
      <div className="mx-auto h-dvh w-full max-w-md sm:shadow-xl sm:ring-1 sm:ring-slate-200">
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
