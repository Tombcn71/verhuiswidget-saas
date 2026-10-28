import type { Metadata } from "next";
import { requireCompany } from "@/lib/current-company";
import { appUrl } from "@/lib/app-url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "../page-header";
import { CopyBlock } from "../embed/copy-block";

export const metadata: Metadata = { title: "Website" };

/** De widget als pop-up op de eigen website van de verhuizer (eenmalig instellen). */
export default async function WebsitePage() {
  const company = await requireCompany();
  const base = appUrl();
  const loaderScript = `<script src="${base}/embed.js" async></script>`;
  const popupLink = `${base}/widget/${company.id}?popup`;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Website"
        description="Laat bezoekers van je site zelf een offerte aanvragen. Eenmalig instellen."
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>1. Plak deze regel in de header of footer van je site</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <CopyBlock code={loaderScript} />
            <p className="text-xs text-muted-foreground">
              WordPress: plugin WPCode · Wix: Instellingen → Aangepaste code · Squarespace:
              Code-injectie · Shopify: theme.liquid, vlak voor &lt;/head&gt;.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Zet deze link achter een knop op je site</CardTitle>
          </CardHeader>
          <CardContent>
            <CopyBlock code={popupLink} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
