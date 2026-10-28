import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Info, MessageCircle, ShieldCheck } from "lucide-react";
import { requireCompany } from "@/lib/current-company";
import { ensureCompanySlug } from "@/lib/companies";
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

/** Korte berichten met het linkje; de verhuizer vult alleen de naam van de klant in. */
function messageTemplates(link: string, company: string): { title: string; text: string }[] {
  return [
    {
      title: "Antwoord op een offerteplatform",
      text: `Hallo [naam], bedankt voor je aanvraag! Dan heb je zo onze prijs: maak via deze link een paar foto's per kamer en je krijgt binnen een minuut je offerte.\n\n${link}\n\nGroet, ${company}`,
    },
    {
      title: "Na een telefoontje",
      text: `Hoi [naam], leuk je net te spreken! Hier is de link: maak een paar foto's per kamer en je hebt binnen een minuut onze prijs.\n\n${link}\n\nGroet, ${company}`,
    },
    {
      title: "Vraagt iemand wat het ongeveer kost?",
      text: `Hoi! Dat rekenen we direct voor je uit. Maak via deze link een paar foto's per kamer, dan heb je binnen een minuut je prijs.\n\n${link}\n\nGroet, ${company}`,
    },
    {
      title: "In plaats van langskomen voor een opname",
      text: `Hoi [naam], langskomen is niet nodig. Maak via deze link een paar foto's per kamer, dan krijg je binnen een minuut een offerte.\n\n${link}\n\nGroet, ${company}`,
    },
  ];
}

export default async function EmbedPage() {
  const company = await requireCompany();
  const base = appUrl();
  const loaderScript = `<script src="${base}/embed.js" async></script>`;
  const popupLink = `${base}/widget/${company.id}?popup`;
  // Kort deellinkje voor WhatsApp/sms/socials; zonder "www." voor de leesbaarheid.
  const directLink = `${base.replace("://www.", "://")}/offerte/${await ensureCompanySlug(company)}`;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Widget-link"
        description="Zo komen klanten bij je offerte-widget: via een linkje in WhatsApp, sms, mail of social media, of via je website."
      />

      <div className="space-y-4">
        {/* Voorkomt de klassieke fout: de deel-link op de website zetten zonder stap 1. */}
        <Card>
          <CardHeader>
            <CardTitle>Welke link gebruik je waar?</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="flex items-center gap-2 font-medium">
                <MessageCircle className="size-4 text-primary" /> Via een linkje
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Voor WhatsApp, sms, mail of socials: gebruik de directe link hieronder. Die opent een eigen
                pagina in jouw huisstijl, met een knop terug naar je website.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="flex items-center gap-2 font-medium">
                <Globe className="size-4 text-primary" /> Via je website
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Gebruik stap 1 én stap 2 hieronder. De widget opent als
                pop-up op je eigen site; je bezoeker blijft bij jou.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary">Linkje</Badge> Directe link voor WhatsApp, sms, mail en socials
            </CardTitle>
            <CardDescription>
              Geen website nodig. Stuur &apos;m na een telefoontje via WhatsApp of sms, of zet &apos;m
              in je Instagram-bio, een Facebook-post of je Google-bedrijfsprofiel. Wie erop klikt,
              krijgt de widget als eigen pagina met jouw logo en kleur. Zet &apos;m{" "}
              <strong>niet</strong> op je website; gebruik daar stap 1 en 2.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CopyBlock code={directLink} />
            <div className="space-y-4 pt-2">
              <div>
                <p className="text-sm font-medium">Kant-en-klare berichten</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Kopiëren, [naam] vervangen en versturen. Het liefst via WhatsApp, dan lezen
                  klanten het meteen. Geen 06-nummer? Dan per mail of als antwoord op het
                  offerteplatform.
                </p>
              </div>
              {messageTemplates(directLink, company.name).map((t) => (
                <div key={t.title}>
                  <p className="mb-1.5 text-sm font-medium">{t.title}</p>
                  <CopyBlock multiline code={t.text} />
                </div>
              ))}
            </div>
            <p className="flex gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              Veilig om te delen: hiermee zijn alleen je publieke tarieven en huisstijl
              zichtbaar, geen klant- of bedrijfsgegevens.
            </p>
            {!company.website && (
              <p className="flex gap-2 text-sm text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" />
                <span>
                  Tip: vul je website in bij{" "}
                  <Link href="/dashboard/instellingen" className="text-primary underline">
                    Bedrijf
                  </Link>
                  , dan krijgt je klant na de offerte een knop terug naar je site.
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge>Website · stap 1</Badge> Eenmalig: activeer de pop-up
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
              <Badge>Website · stap 2</Badge> Zet deze link achter je knop
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

      </div>
    </div>
  );
}
