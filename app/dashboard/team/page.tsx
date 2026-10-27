import type { Metadata } from "next";
import Link from "next/link";
import { OrganizationProfile } from "@clerk/nextjs";
import { Users } from "lucide-react";
import { isOrgAdmin, requireCompany } from "@/lib/current-company";
import { countMembers } from "@/lib/companies";
import { MORE_SEATS_MAILTO, nextPlan, planFor, seatLimit } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "../page-header";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage({ searchParams }: PageProps<"/dashboard/team">) {
  const company = await requireCompany();
  const [members, admin, { welkom }] = await Promise.all([
    countMembers(company),
    isOrgAdmin(),
    searchParams,
  ]);

  const plan = planFor(company);
  const limit = seatLimit(company);
  const full = members >= limit;
  const upgrade = nextPlan(plan);

  return (
    <>
      {welkom !== undefined ? (
        // Eerste bezoek na het aanmaken (via /kies-plan bij Pro).
        <PageHeader
          title={`Welkom bij moverAI, ${company.name}!`}
          description={
            <>
              Je {plan.label}-plan heeft plek voor {limit} gebruikers. Nodig je collega&apos;s uit
              via &lsquo;Leden&rsquo; → &lsquo;Uitnodigen&rsquo; hieronder, of doe het later via
              Team in het menu.
            </>
          }
          action={
            <Button asChild variant="outline">
              <Link href="/dashboard">Overslaan, naar dashboard</Link>
            </Button>
          }
        />
      ) : (
        <PageHeader
          title="Team"
          description="Nodig collega's uit en beheer wie toegang heeft. Admins beheren tarieven en bedrijfsgegevens; leden werken met de leads."
        />
      )}

      <Card className={full ? "mb-4 border-amber-200 bg-amber-50" : "mb-4"}>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Users className="size-5 text-muted-foreground" />
          <div className="min-w-48 flex-1">
            <p className="text-sm">
              <strong className="tabular-nums">
                {members} / {limit}
              </strong>{" "}
              {limit === 1 ? "gebruiker" : "gebruikers"} op {plan.label}
              {full &&
                (upgrade
                  ? ` — wil je collega's toevoegen? ${upgrade.label} heeft plek voor ${upgrade.seats}.`
                  : " — meer gebruikers nodig? Neem contact met ons op.")}
            </p>
            <Progress value={Math.min(100, (members / limit) * 100)} className="mt-2 h-1.5" />
          </div>
          {full && admin && (
            <Button asChild size="sm">
              {upgrade ? (
                <Link href="/dashboard/abonnement">Upgraden</Link>
              ) : (
                <a href={MORE_SEATS_MAILTO}>Neem contact op</a>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      <OrganizationProfile
        routing="hash"
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox: "w-full max-w-none rounded-xl border shadow-none",
          },
        }}
      />
    </>
  );
}
