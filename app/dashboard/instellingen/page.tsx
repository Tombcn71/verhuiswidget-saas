import type { Metadata } from "next";
import { requireCompany } from "@/lib/current-company";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Bedrijf & tarieven" };

export default async function SettingsPage() {
  const company = await requireCompany();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bedrijf &amp; tarieven</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pas je bedrijfsgegevens en prijzen aan. Wijzigingen gelden direct voor nieuwe aanvragen.
        </p>
      </div>
      <SettingsForm company={company} />
    </div>
  );
}
