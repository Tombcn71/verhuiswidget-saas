import type { Metadata } from "next";
import { requireAdminCompany } from "@/lib/current-company";
import { PageHeader } from "../page-header";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Bedrijf" };

export default async function SettingsPage() {
  const company = await requireAdminCompany();

  return (
    <>
      <PageHeader
        title="Bedrijf"
        description="Je bedrijfsgegevens en huisstijl. Prijzen stel je in bij Tarieven."
      />
      <SettingsForm company={company} />
    </>
  );
}
