import type { Metadata } from "next";
import { OrganizationProfile } from "@clerk/nextjs";
import { requireCompany } from "@/lib/current-company";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  await requireCompany();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="mt-1 text-sm text-slate-500">
          Nodig collega&apos;s uit en beheer wie toegang heeft. Admins beheren tarieven en
          bedrijfsgegevens; leden werken met de leads.
        </p>
      </div>
      <OrganizationProfile routing="hash" />
    </div>
  );
}
