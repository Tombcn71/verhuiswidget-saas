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
  const base = appUrl();
  const loaderScript = `<script src="${base}/embed.js" async></script>`;
  const popupLink = `${base}/widget/${company.id}?popup`;
  // Kort deellinkje; zonder "www." voor de leesbaarheid.
  const directLink = `${base.replace("://www.", "://")}/offerte/${await ensureCompanySlug(company)}`;

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

        <details className="rounded-xl border bg-card">
          <summary className="cursor-pointer px-6 py-4 font-medium">Ook op je website?</summary>
          <div className="space-y-5 px-6 pb-6 text-sm">
            <div className="space-y-2">
              <p className="font-medium">1. Plak deze regel in de header of footer van je site</p>
              <CopyBlock code={loaderScript} />
              <p className="text-xs text-muted-foreground">
                WordPress: plugin WPCode · Wix: Instellingen → Aangepaste code · Squarespace:
                Code-injectie · Shopify: theme.liquid, vlak voor &lt;/head&gt;.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">2. Zet deze link achter een knop op je site</p>
              <CopyBlock code={popupLink} />
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
