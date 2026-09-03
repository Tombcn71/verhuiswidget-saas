import { notFound } from "next/navigation";
import { getCompanyById } from "@/lib/companies";
import { Widget } from "./widget";

export const dynamic = "force-dynamic";

export default async function WidgetPage({
  params,
}: PageProps<"/widget/[companyId]">) {
  const { companyId } = await params;
  const company = await getCompanyById(companyId);
  if (!company) notFound();

  return (
    <Widget
      company={{
        id: company.id,
        name: company.name,
        logoUrl: company.logoUrl,
        primaryColor: company.primaryColor,
        phone: company.phone,
      }}
    />
  );
}
