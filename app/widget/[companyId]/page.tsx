import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCompanyById, normalizeServiceType } from "@/lib/companies";
import { scanLimitReached } from "@/lib/scan-alerts";
import { Widget } from "./widget";

export const dynamic = "force-dynamic";

/** "devries.nl" → "https://devries.nl"; null als er geen website is ingevuld. */
function websiteUrl(website: string | null): string | null {
  const w = website?.trim();
  if (!w) return null;
  return /^https?:\/\//i.test(w) ? w : `https://${w}`;
}

/**
 * Titel en preview in de huisstijl van de verhuizer: zo ziet de klant in
 * WhatsApp/sms "Offerte aanvragen bij …" in plaats van moverAI (Onlink).
 */
export async function generateMetadata({
  params,
}: PageProps<"/widget/[companyId]">): Promise<Metadata> {
  const { companyId } = await params;
  const company = await getCompanyById(companyId);
  if (!company) return {};
  const title = `Offerte aanvragen bij ${company.name}`;
  const description = "Maak foto's van je kamers en ontvang binnen een minuut je offerte.";
  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      siteName: company.name,
    },
    robots: { index: false },
  };
}

export default async function WidgetPage({
  params,
  searchParams,
}: PageProps<"/widget/[companyId]">) {
  const { companyId } = await params;
  const { embed, preview, popup } = await searchParams;
  const company = await getCompanyById(companyId);
  if (!company) notFound();

  // Alleen op de losse pagina terug naar de site van de verhuizer; in de
  // pop-up/iframe sluit de klant gewoon het venster.
  const standalone = embed === undefined;
  // Scans op: alleen een contactformulier. Test je tarieven (preview) werkt altijd.
  const limitReached = preview === undefined && (await scanLimitReached(company));

  const widget = (
    <Widget
      preview={preview !== undefined}
      // `?popup`-links (ook in de embed.js-modal) en losse links = Onlink; de iframe op de site = Onsite.
      source={popup !== undefined || standalone ? "onlink" : "onsite"}
      backUrl={standalone && preview === undefined ? websiteUrl(company.website) : null}
      // Losse pagina (linkje): de klant zit niet op de site van de verhuizer, dus de naam erbij.
      showName={standalone}
      limitReached={limitReached}
      company={{
        id: company.id,
        name: company.name,
        logoUrl: company.logoUrl,
        primaryColor: company.primaryColor,
        phone: company.phone,
        serviceType: normalizeServiceType(company.serviceType),
      }}
    />
  );

  // In een <iframe> (embed.js): kale widget, de host regelt de omlijsting.
  if (!standalone) return widget;

  // Directe link: exact dezelfde weergave als de demo — fullscreen, van boven tot onder.
  // Gecentreerde app-kolom; op telefoons is dat de volle breedte.
  return (
    <div className="mx-auto w-full max-w-md bg-white sm:shadow-xl sm:ring-1 sm:ring-slate-200">
      {widget}
    </div>
  );
}
