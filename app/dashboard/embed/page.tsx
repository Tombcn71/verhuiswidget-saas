import type { Metadata } from "next";
import { Info, ShieldCheck } from "lucide-react";
import { requireCompany } from "@/lib/current-company";
import { appUrl } from "@/lib/app-url";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "../page-header";
import { CopyBlock } from "./copy-block";

export const metadata: Metadata = { title: "Widget-link" };

export default async function EmbedPage() {
  const company = await requireCompany();
  const base = appUrl();
  const loaderScript = `<script src="${base}/embed.js" async></script>`;
  const popupLink = `${base}/widget/${company.id}?popup`;
  const directLink = `${base}/widget/${company.id}`;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Widget op je website"
        description="Twee stappen. Stap 1 doe je één keer, stap 2 zet je achter elke knop die je wilt."
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge>Stap 1</Badge> Eenmalig: activeer de pop-up
            </CardTitle>
            <CardDescription>
              Plak deze regel in de <strong>algemene code</strong> van je site (het veld voor
              &ldquo;header&rdquo; of &ldquo;footer / voettekst&rdquo; in je website-instellingen —
              niet op een losse pagina).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CopyBlock code={loaderScript} />
            <p className="text-xs text-muted-foreground">
              WordPress: plugin &ldquo;WPCode&rdquo; → Header &amp; Footer → Footer · Wix:
              Instellingen → Aangepaste code · Squarespace: Instellingen → Geavanceerd → Code
              injectie · Shopify: thema <code>theme.liquid</code> vlak voor{" "}
              <code>&lt;/head&gt;</code>.
            </p>
            <p className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <Info className="mt-0.5 size-4 shrink-0" />
              Zonder stap 1 gaat je bezoeker naar een aparte pagina in plaats van een pop-up op
              je eigen site.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge>Stap 2</Badge> Zet deze link achter je knop
            </CardTitle>
            <CardDescription>
              Klik erop en de widget opent in een pop-up over je site — geen code op de pagina
              zelf. In je websitebouwer: knop selecteren → &ldquo;link toevoegen&rdquo; → deze
              link plakken.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CopyBlock code={popupLink} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Of: deel als directe link</CardTitle>
            <CardDescription>
              Geen website nodig. Zet deze link in je Instagram-bio, een Facebook-post, je
              Google-bedrijfsprofiel, een e-mailhandtekening of stuur &apos;m via WhatsApp. Wie
              erop klikt, krijgt de widget als eigen pagina.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CopyBlock code={directLink} />
            <p className="flex gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              Veilig om te delen: hiermee zijn alleen je publieke tarieven en huisstijl
              zichtbaar, geen klant- of bedrijfsgegevens.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
