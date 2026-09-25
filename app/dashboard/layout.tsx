import Link from "next/link";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { isOrgAdmin, requireCompany } from "@/lib/current-company";
import { countLeadsThisMonth } from "@/lib/leads";
import {
  nextPlan,
  planFor,
  scanUsage,
  trialState,
  type Plan,
  type ScanUsage,
  type TrialState,
} from "@/lib/plans";
import { Logo } from "@/app/_components/logo";
import { DashboardNav } from "./nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const company = await requireCompany();
  const [admin, used] = await Promise.all([isOrgAdmin(), countLeadsThisMonth(company.id)]);
  const plan = planFor(company);
  const trial = trialState(company);
  const notice = planNotice(plan, scanUsage(company, used), trial);

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Logo className="text-base" />
            <span className="hidden rounded-full border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500 sm:inline">
              {plan.label}
              {trial.kind === "trial" && ` · proef nog ${trial.daysLeft}d`}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <OrganizationSwitcher
              hidePersonal
              afterSelectOrganizationUrl="/dashboard"
              afterCreateOrganizationUrl="/dashboard"
              organizationProfileMode="navigation"
              organizationProfileUrl="/dashboard/team"
            />
            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8 md:flex-row">
        <DashboardNav admin={admin} />
        <main className="min-w-0 flex-1">
          {notice && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span>{notice}</span>
              {admin ? (
                <Link
                  href="/dashboard/abonnement"
                  className="rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-700"
                >
                  Bekijk plannen
                </Link>
              ) : (
                <span className="text-amber-700">Vraag je beheerder om te upgraden.</span>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * De melding bovenaan het dashboard. De scan-limiet is zacht: er wordt nooit
 * geblokkeerd, alleen een upgrade aangeboden.
 */
function planNotice(plan: Plan, usage: ScanUsage, trial: TrialState): string | null {
  if (trial.kind === "expired") {
    return "Je proefperiode is afgelopen. Kies een plan om moverAI te blijven gebruiken.";
  }
  const upgrade = nextPlan(plan);
  if (usage.over && upgrade) {
    return `Je hebt deze maand ${usage.used} offerteaanvragen ontvangen, meer dan de ${usage.limit} van ${plan.label}. Alles blijft gewoon werken — met ${upgrade.label} heb je ${upgrade.scans === null ? "onbeperkt" : upgrade.scans} per maand.`;
  }
  if (usage.nearLimit && upgrade) {
    return `Je zit op ${usage.used} van de ${usage.limit} offerteaanvragen deze maand. Groei je door? ${upgrade.label} geeft meer ruimte.`;
  }
  if (trial.kind === "trial" && trial.daysLeft <= 3) {
    return `Je proefperiode loopt over ${trial.daysLeft} ${trial.daysLeft === 1 ? "dag" : "dagen"} af.`;
  }
  return null;
}
