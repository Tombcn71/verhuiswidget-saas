import { notFound } from "next/navigation";
import { getCompanyById, normalizeServiceType } from "@/lib/companies";
import { Widget } from "./widget";

export const dynamic = "force-dynamic";

export default async function WidgetPage({
  params,
  searchParams,
}: PageProps<"/widget/[companyId]">) {
  const { companyId } = await params;
  const { embed, preview } = await searchParams;
  const company = await getCompanyById(companyId);
  if (!company) notFound();

  const widget = (
    <Widget
      preview={preview !== undefined}
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
  if (embed !== undefined) return widget;

  // Directe link: exact dezelfde weergave als de demo — fullscreen, van boven tot onder.
  // Gecentreerde app-kolom; op telefoons is dat de volle breedte.
  return (
    <div className="mx-auto w-full max-w-md bg-white sm:shadow-xl sm:ring-1 sm:ring-slate-200">
      {widget}
    </div>
  );
}
