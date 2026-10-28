import Link from "next/link";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { isOrgAdmin, requireCompany } from "@/lib/current-company";
import { countLeadsThisMonth } from "@/lib/leads";
import {
  CONTACT_EMAIL,
  nextPlan,
  planFor,
  scanUsage,
  trialState,
  type Plan,
  type ScanUsage,
  type TrialState,
} from "@/lib/plans";
import { TriangleAlert } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "./app-sidebar";
import { ThemeToggle } from "@/components/theme";
import { FeedbackButton } from "@/app/_components/FeedbackButton";
import { WhatsAppButton } from "@/app/_components/whatsapp-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const company = await requireCompany();
  const [admin, used] = await Promise.all([isOrgAdmin(), countLeadsThisMonth(company.id)]);
  const plan = planFor(company);
  const trial = trialState(company);
  const usage = scanUsage(company, used);
  const notice =
    company.subscriptionStatus === "past_due"
      ? "Je laatste betaling is mislukt. Werk je betaalmethode bij om moverAI te blijven gebruiken."
      : planNotice(plan, usage, trial);
  // Rood bij een mislukte betaling of als de scans op zijn; anders oranje.
  const urgent =
    company.subscriptionStatus === "past_due" || (usage.over && trial.kind !== "expired");

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          admin={admin}
          planLabel={plan.label}
          trialDaysLeft={trial.kind === "trial" ? trial.daysLeft : null}
          trialExpired={trial.kind === "expired"}
        />
        <SidebarInset className="bg-muted/40">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-4!" />
            <div className="ml-auto flex items-center gap-3">
              <OrganizationSwitcher
                hidePersonal
                skipInvitationScreen
                afterSelectOrganizationUrl="/dashboard"
                afterCreateOrganizationUrl="/dashboard"
                organizationProfileMode="navigation"
                organizationProfileUrl="/dashboard/team"
              />
              <ThemeToggle />
              <UserButton />
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
            {notice && (
              <div
                className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
                  urgent
                    ? "border-red-200 bg-red-50 text-red-900"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                <span className="flex items-center gap-2">
                  <TriangleAlert className="size-4 shrink-0" />
                  {notice}
                </span>
                {admin ? (
                  <Button
                    asChild
                    size="sm"
                    className={urgent ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}
                  >
                    <Link href="/dashboard/abonnement">Bekijk plannen</Link>
                  </Button>
                ) : (
                  <span className={urgent ? "text-red-700" : "text-amber-700"}>
                    Vraag je beheerder om te upgraden.
                  </span>
                )}
              </div>
            )}
            {children}
          </main>
        </SidebarInset>
        <FeedbackButton />
        <WhatsAppButton message="Hoi, ik heb een vraag over mijn moverAI-dashboard" />
      </SidebarProvider>
    </TooltipProvider>
  );
}

/**
 * De melding bovenaan het dashboard. De scan-limiet is hard: zijn de scans op,
 * dan krijgen klanten geen directe prijs meer (alleen een contactformulier).
 */
function planNotice(plan: Plan, usage: ScanUsage, trial: TrialState): string | null {
  if (trial.kind === "expired") {
    return "Je proefperiode is afgelopen. Nieuwe aanvragen komen nog binnen, maar je ziet ze pas als je een plan activeert.";
  }
  const upgrade = nextPlan(plan);
  if (usage.over && upgrade) {
    return `Je scans van deze maand zijn op (${usage.used} van ${usage.limit}). Nieuwe klanten krijgen geen directe prijs meer, alleen een contactformulier. Met ${upgrade.label} heb je ${upgrade.scans === null ? "onbeperkt" : upgrade.scans.toLocaleString("nl-NL")} scans per maand.`;
  }
  // Geen groter pakket (Pro, op maat): dan een pakket op maat via contact.
  if (usage.over) {
    return `Je scans van deze maand zijn op (${usage.used} van ${usage.limit}). Nieuwe klanten krijgen geen directe prijs meer, alleen een contactformulier. Mail ${CONTACT_EMAIL} voor een pakket op maat.`;
  }
  if (usage.nearLimit) {
    return `Je zit op ${usage.used} van de ${usage.limit} inboedelscans deze maand. Zijn ze op, dan krijgen nieuwe klanten geen directe prijs meer. ${upgrade ? `${upgrade.label} geeft meer ruimte.` : `Mail ${CONTACT_EMAIL} voor een pakket op maat.`}`;
  }
  if (trial.kind === "trial" && trial.daysLeft <= 3) {
    return `Je proefperiode loopt over ${trial.daysLeft} ${trial.daysLeft === 1 ? "dag" : "dagen"} af.`;
  }
  return null;
}
