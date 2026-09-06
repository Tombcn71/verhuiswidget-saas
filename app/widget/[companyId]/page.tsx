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

  // Directe link: op mobiel fullscreen (voelt als een app), op desktop een kaart in app-formaat.
  return (
    <div className="flex min-h-dvh justify-center bg-white sm:min-h-screen sm:bg-slate-50 sm:px-4 sm:py-12">
      <div className="w-full sm:h-fit sm:max-w-md sm:rounded-2xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-slate-200">
        {widget}
      </div>
    </div>
  );
}
