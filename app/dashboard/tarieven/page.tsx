import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminCompany } from "@/lib/current-company";
import { normalizeServiceType } from "@/lib/companies";
import { PageHeader } from "../page-header";
import { TariffForm } from "./tariff-form";

export const metadata: Metadata = { title: "Tarieven" };

export default async function TariffPage() {
  const company = await requireAdminCompany();
  const serviceType = normalizeServiceType(company.serviceType);

  return (
    <>
      <PageHeader
        title="Tarieven"
        description={
          <>
            Alle bedragen zijn exclusief btw. De widget rekent hiermee de offerteprijs uit;
            wijzigingen gelden direct voor nieuwe aanvragen.
            {serviceType === "beide" && (
              <>
                {" "}
                Je biedt verhuizen én ontruimen aan; dat wijzig je bij{" "}
                <Link href="/dashboard/instellingen" className="text-primary underline">
                  Bedrijf
                </Link>
                .
              </>
            )}
          </>
        }
      />
      <TariffForm company={company} serviceType={serviceType} />
    </>
  );
}
