import type { Metadata } from "next";
import { requireCompany } from "@/lib/current-company";
import { ensureCompanySlug } from "@/lib/companies";
import { appUrl } from "@/lib/app-url";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "../page-header";
import { CopyBlock } from "./copy-block";
import { SendLink } from "./send-link";
import { linkMessage } from "./message";

export const metadata: Metadata = { title: "Jouw linkje" };

export default async function EmbedPage() {
  const company = await requireCompany();
  // Kort deellinkje; zonder "www." voor de leesbaarheid.
  const directLink = `${appUrl().replace("://www.", "://")}/offerte/${await ensureCompanySlug(company)}`;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Jouw linkje"
        description="Stuur het naar elke aanvraag, ook van offerteplatforms."
      />

      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-4">
            <CopyBlock code={directLink} />
            <SendLink defaultMessage={linkMessage(directLink, company.name)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
