import type { Metadata } from "next";
import Link from "next/link";
import { OrganizationProfile } from "@clerk/nextjs";
import { isOrgAdmin, requireCompany } from "@/lib/current-company";
import { countMembers } from "@/lib/companies";
import { nextPlan, planFor, seatLimit } from "@/lib/plans";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const company = await requireCompany();
  const [members, admin] = await Promise.all([countMembers(company), isOrgAdmin()]);

  const plan = planFor(company);
  const limit = seatLimit(company);
  const full = members >= limit;
  const upgrade = nextPlan(plan);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="mt-1 text-sm text-slate-500">
          Nodig collega&apos;s uit en beheer wie toegang heeft. Admins beheren tarieven en
          bedrijfsgegevens; leden werken met de leads.
        </p>
      </div>

      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
          full ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-white"
        }`}
      >
        <span>
          <strong>
            {members} / {limit}
          </strong>{" "}
          {limit === 1 ? "gebruiker" : "gebruikers"} op {plan.label}.
          {full &&
            (upgrade
              ? ` Wil je collega's toevoegen? ${upgrade.label} heeft plek voor ${upgrade.seats}.`
              : " Extra gebruikers kun je bijkopen via je abonnement.")}
        </span>
        {full && admin && (
          <Link
            href="/dashboard/abonnement"
            className="rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-700"
          >
            {upgrade ? "Upgraden" : "Abonnement"}
          </Link>
        )}
      </div>

      <OrganizationProfile routing="hash" />
    </div>
  );
}
