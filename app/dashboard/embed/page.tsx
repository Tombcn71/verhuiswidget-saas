import type { Metadata } from "next";
import { requireCompany } from "@/lib/current-company";
import { appUrl } from "@/lib/app-url";
import { CopyBlock } from "./copy-block";

export const metadata: Metadata = { title: "Widget-link" };

export default async function EmbedPage() {
  const company = await requireCompany();
  const base = appUrl();

  const loaderScript = `<script src="${base}/embed.js" async></script>`;
  const popupLink = `${base}/widget/${company.id}?popup`;
  const directLink = `${base}/widget/${company.id}`;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Widget op je website</h1>
        <p className="mt-1 text-sm text-slate-600">
          Twee stappen. Stap 1 doe je één keer, stap 2 zet je achter elke knop die je
          wilt.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Stap 1 — eenmalig: activeer de pop-up</h2>
        <p className="text-sm text-slate-600">
          Plak deze regel in de <strong>algemene code</strong> van je site (het veld voor
          &ldquo;header&rdquo; of &ldquo;footer / voettekst&rdquo; in je website-instellingen —
          niet op een losse pagina). Bijna elke website-bouwer heeft dat:
        </p>
        <CopyBlock code={loaderScript} />
        <p className="text-xs text-slate-500">
          WordPress: thema-instellingen → &ldquo;Aangepaste code / header&rdquo; · Wix:
          Instellingen → Aangepaste code · Squarespace: Instellingen → Geavanceerd → Code
          injectie · Shopify: thema <code>theme.liquid</code> vlak voor{" "}
          <code>&lt;/head&gt;</code>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Stap 2 — zet deze link achter je knop</h2>
        <p className="text-sm text-slate-600">
          Heb je een knop op je site? Zet hier de link van die knop naartoe. Klik erop en de
          widget opent in een pop-up over je site — geen code op de pagina zelf.
        </p>
        <CopyBlock code={popupLink} />
        <p className="text-xs text-slate-500">
          In je bouwer: knop selecteren → &ldquo;link toevoegen&rdquo; → deze link plakken.
        </p>
      </section>

      <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
        Nog geen stap 1 gedaan? Dan opent dezelfde link gewoon als een aparte pagina (ook
        prima). Met stap 1 wordt het de pop-up.
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Of: deel als directe link</h2>
        <p className="text-sm text-slate-600">
          Geen website nodig. Zet deze link in je Instagram-bio, een Facebook-post, een
          Google-bedrijfsprofiel, een e-mailhandtekening of stuur &apos;m via WhatsApp. Wie
          erop klikt, krijgt de widget als eigen pagina.
        </p>
        <CopyBlock code={directLink} />
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Veilig om te delen:</strong> hiermee zijn alleen je publieke tarieven en
          huisstijl zichtbaar, geen klant- of bedrijfsgegevens.
        </p>
      </section>
    </div>
  );
}
