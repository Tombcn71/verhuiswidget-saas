import type { Metadata } from "next";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAdminCompany } from "@/lib/current-company";
import { getSubscriptionTerm, refreshFromStripe } from "@/lib/billing";
import { countMembers } from "@/lib/companies";
import { countLeadsThisMonth } from "@/lib/leads";
import {
  CHANNEL_FEATURES,
  MORE_SEATS_MAILTO,
  PLANS,
  PLAN_ORDER,
  normalizeInterval,
  normalizePlan,
  planFor,
  scanUsage,
  seatLimit,
  trialState,
  yearlyPerMonthEuros,
} from "@/lib/plans";
import { formatDate, formatEuroCents } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Check, CircleCheck, ExternalLink, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "../page-header";
import { UsageBar } from "../usage-bar";
import { ScanInfo } from "@/app/_components/scan-info";
import { openBillingPortal, startCheckout } from "./actions";
import { CancelSubscription, DeleteAccount } from "./account-actions";

export const metadata: Metadata = { title: "Abonnement" };

export default async function SubscriptionPage({
  searchParams,
}: PageProps<"/dashboard/abonnement">) {
  // Altijd de actuele stand uit Stripe, ook als de webhook nog niet binnen is.
  const company = await refreshFromStripe(await requireAdminCompany());
  const [used, members, term, { fout, plan: wanted, betaald, periode }] = await Promise.all([
    countLeadsThisMonth(company.id),
    countMembers(company),
    getSubscriptionTerm(company),
    searchParams,
  ]);

  const plan = planFor(company);
  const interval = normalizeInterval(periode);
  const usage = scanUsage(company, used);
  const trial = trialState(company);
  // Met een lopend Stripe-abonnement gaat alles (wisselen, opzeggen) via het portaal.
  const subscribed = company.stripeSubscriptionId !== null;
  const pastDue = company.subscriptionStatus === "past_due";
  const endsOn = term?.cancelAt ?? term?.periodEnd ?? null;

  const error =
    fout === "teamleden"
      ? `Je team heeft ${members} leden; ${PLANS[normalizePlan(wanted)].label} staat er maximaal ${PLANS[normalizePlan(wanted)].seats} toe. Verwijder eerst teamleden.`
      : pastDue
        ? "Je laatste betaling is mislukt. Werk je betaalmethode bij via 'Abonnement beheren'; Stripe probeert het automatisch opnieuw."
        : null;

  const statusText =
    trial.kind === "trial"
      ? `Proefperiode: nog ${trial.daysLeft} ${trial.daysLeft === 1 ? "dag" : "dagen"} (tot ${formatDate(company.trialEndsAt)}). Activeer nu een plan en je betaalt pas als je proef voorbij is.`
      : trial.kind === "expired"
        ? "Je proefperiode is afgelopen. Nieuwe aanvragen komen nog gewoon binnen; je ziet ze zodra je een plan activeert."
        : `Je zit op ${plan.label}.`;

  return (
    <>
      <PageHeader
        title="Abonnement"
        description={statusText}
        action={
          subscribed && (
            <form action={openBillingPortal}>
              <Button type="submit" variant="outline">
                <ExternalLink /> Abonnement beheren
              </Button>
            </form>
          )
        }
      />
      {subscribed && (
        <p className="-mt-4 mb-6 text-xs text-muted-foreground">
          Via &ldquo;Abonnement beheren&rdquo;: facturen, betaalmethode of plan wisselen.
        </p>
      )}

      {betaald !== undefined && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CircleCheck className="size-4 shrink-0" />
          Gelukt, bedankt! Je abonnement wordt geactiveerd — dat kan een minuutje duren.
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <TriangleAlert className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="gap-3">
          <CardHeader>
            <CardDescription>
              Inboedelscans deze maand
              <ScanInfo />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsageBar usage={usage} />
          </CardContent>
        </Card>
        <Card className="gap-3">
          <CardHeader>
            <CardDescription>Gebruikers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {members} <span className="text-base font-normal text-muted-foreground">/ {seatLimit(company)}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {!subscribed && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Kies je plan</h2>
          {/* Periode via de URL (?periode=jaar), zodat de server de juiste prijs toont. */}
          <Tabs value={interval}>
            <TabsList>
              <TabsTrigger value="month" asChild>
                <Link href="/dashboard/abonnement">Maandelijks</Link>
              </TabsTrigger>
              <TabsTrigger value="year" asChild>
                <Link href="/dashboard/abonnement?periode=jaar">
                  Jaarlijks <Badge variant="secondary">2 maanden gratis</Badge>
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          const current = p.id === plan.id;
          return (
            <form key={p.id} action={subscribed ? openBillingPortal : startCheckout}>
              <input type="hidden" name="plan" value={p.id} />
              <input type="hidden" name="interval" value={interval} />
              <Card className={cn("h-full", current && "border-primary ring-1 ring-primary")}>
                <CardHeader>
                  <CardTitle>{p.label}</CardTitle>
                  <CardDescription>{p.audience}</CardDescription>
                  {current && (
                    <CardAction>
                      <Badge>Huidig</Badge>
                    </CardAction>
                  )}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  {interval === "year" && !subscribed ? (
                    <>
                      <p className="text-3xl font-semibold tabular-nums">
                        €{yearlyPerMonthEuros(p)}
                        <span className="text-sm font-normal text-muted-foreground"> /mnd excl. btw</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatEuroCents(p.yearlyCents)} per jaar, vooraf
                      </p>
                    </>
                  ) : (
                    <p className="text-3xl font-semibold tabular-nums">
                      {formatEuroCents(p.priceCents)}
                      <span className="text-sm font-normal text-muted-foreground"> /mnd excl. btw</span>
                    </p>
                  )}
                  <ul className="mt-4 flex-1 space-y-2 text-sm">
                    {[
                      `${p.seats} ${p.seats === 1 ? "gebruiker" : "gebruikers"}`,
                      p.scans === null
                        ? "Onbeperkt inboedelscans"
                        : `${p.scans.toLocaleString("nl-NL")} inboedelscans per maand${p.fairUse ? " (fair use)" : ""}`,
                      ...CHANNEL_FEATURES,
                      "Verhuizen én ontruimen",
                    ].map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {p.id === "pro" && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Meer dan {p.seats} gebruikers of {p.scans?.toLocaleString("nl-NL")} scans?{" "}
                      <a href={MORE_SEATS_MAILTO} className="font-medium text-primary underline">
                        Neem contact op
                      </a>
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="mt-6 w-full"
                    variant={current ? "outline" : "default"}
                    disabled={subscribed && current}
                  >
                    {subscribed
                      ? current
                        ? "Huidig plan"
                        : `Wissel naar ${p.label}`
                      : `Activeer ${p.label}`}
                  </Button>
                </CardContent>
              </Card>
            </form>
          );
        })}
      </div>

      {subscribed && (
        <CancelSubscription
          endsOn={endsOn ? formatDate(endsOn) : null}
          cancelled={term?.cancelAt != null}
        />
      )}
      <DeleteAccount companyName={company.name} subscribed={subscribed} />
    </>
  );
}
