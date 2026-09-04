import type { Metadata } from "next";
import Link from "next/link";
import { requireCompany } from "@/lib/current-company";
import { normalizeServiceType } from "@/lib/companies";
import { TariffForm } from "./tariff-form";

export const metadata: Metadata = { title: "Tarieven" };

export default async function TariffPage() {
  const company = await requireCompany();
  const serviceType = normalizeServiceType(company.serviceType);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tarieven</h1>
        <p className="mt-1 text-sm text-slate-600">
          Alle bedragen zijn exclusief btw. De widget rekent hiermee de offerteprijs uit.
          Wijzigingen gelden direct voor nieuwe aanvragen.
        </p>
        {serviceType === "beide" && (
          <p className="mt-2 text-sm text-slate-600">
            Je biedt beide diensten aan, dus je stelt aparte tarieven in voor verhuizen en
            ontruimen. Wisselen kan bij{" "}
            <Link href="/dashboard/instellingen" className="text-brand-600 underline">
              Bedrijf
            </Link>
            .
          </p>
        )}
      </div>
      <TariffForm company={company} serviceType={serviceType} />
    </div>
  );
}
