"use client";

import { useState } from "react";
import Link from "next/link";
import { ScanInfo } from "@/app/_components/scan-info";
import { PlanDemoButton } from "./plan-demo-button";
import {
  CHANNEL_FEATURES,
  MORE_SEATS_MAILTO,
  OP_MAAT_FROM_EUROS,
  PLANS,
  PLAN_ORDER,
  yearlyPerMonthEuros,
  type BillingInterval,
  type Plan,
  type PlanId,
} from "@/lib/plans";

// Teksten per plan; aantallen (gebruikers, scans, prijzen) komen uit `lib/plans.ts`.
const PLAN_TAGLINE: Record<PlanId, string> = {
  basic: "Voor de zelfstandige verhuizer, alleen of met z'n tweeën.",
  pro: "Voor verhuisbedrijven met personeel en een kantoor of planner.",
  premium: "Meer gebruikers of meer scans nodig? We maken een pakket dat bij je past.",
};

type Feature = {
  text: string;
  /** Verschilt per plan: blauw en vet, zodat je kaarten horizontaal vergelijkt. */
  highlight?: boolean;
  scanInfo?: boolean;
};

/**
 * Volledige lijst in elke kaart, in dezelfde volgorde: eerst de verschillen
 * (gebruikers, scans, in blauw), dan wat in elk pakket zit. Zo lijnen de kaarten uit.
 */
function planFeatures(plan: Plan): Feature[] {
  const seats: Feature = {
    text: `${plan.seats} ${plan.seats === 1 ? "gebruiker" : "gebruikers"}${plan.id === "pro" ? " om flexibel samen te werken" : ""}`,
    highlight: true,
  };
  const scans: Feature = {
    text: `${plan.scans === null ? "Onbeperkt" : plan.scans.toLocaleString("nl-NL")} inboedelscans per maand${plan.fairUse ? " (fair use)" : ""}`,
    highlight: true,
    scanInfo: true,
  };
  return [
    seats,
    scans,
    // Pro: genoeg scans om elke aanvraag van een offerteplatform je linkje te sturen.
    ...(plan.id === "pro"
      ? [{ text: "Genoeg voor al je aanvragen van offerteplatforms", highlight: true }]
      : []),
    ...CHANNEL_FEATURES.map((text) => ({ text })),
    { text: "White-label: je eigen bedrijfsnaam en huisstijlkleur" },
    { text: "Tarieven volledig instelbaar: m³, km en toeslagen" },
    { text: "Automatische herinnering bij openstaande offertes" },
    { text: "Automatisch reviewverzoek na de verhuizing" },
  ];
}

/** "Zo werkt je proefperiode": staat boven de pakketten op de homepage. */
export function TrialCard({
  primaryButton,
  calendlyUrl,
}: {
  primaryButton: string;
  calendlyUrl: string | null;
}) {
  return (
    <div className="mx-auto mt-10 max-w-2xl rounded-2xl border-2 border-brand-600 bg-background p-6 shadow-sm sm:p-8">
      <h3 className="text-lg font-semibold">Zo werkt je proefperiode</h3>
      <ul className="mt-4 space-y-3 text-sm">
        {[
          "14 dagen alle functies",
          "Upload een oude factuur en je tarieven staan klaar",
          "Persoonlijke hulp bij het instellen, via WhatsApp",
        ].map((text) => (
          <li key={text} className="flex gap-2.5">
            <CheckIcon />
            <span>{text}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        Van je factuur lezen we alleen de tarieven; de factuur zelf wordt niet bewaard.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/kies-plan?plan=pro"
          className={`w-full rounded-full px-6 py-3 text-center font-semibold sm:w-auto ${primaryButton}`}
        >
          Start je gratis proefperiode
        </Link>
        {calendlyUrl && (
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener"
            className="w-full rounded-full border border-border bg-background px-6 py-3 text-center font-semibold shadow-sm transition hover:bg-muted sm:w-auto"
          >
            Plan een vrijblijvend adviesgesprek
          </a>
        )}
      </div>
      {calendlyUrl && (
        <p className="mt-2 text-xs text-muted-foreground">
          Adviesgesprek: 15 minuten, ook &apos;s avonds mogelijk.
        </p>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="mt-0.5 h-4 w-4 shrink-0 text-brand-600"
    >
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const euro = (cents: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    cents / 100,
  );

/**
 * Prijskaarten met de schakelaar Maandelijks / Jaarlijks. Met `demo` (pagina
 * Pakketten) geen bedragen: die noemt Tom in het demogesprek; elke kaart krijgt
 * dan een knop "Plan een demogesprek".
 */
export function PricingCards({ demo }: { demo?: { href: string | null } } = {}) {
  const [interval, setInterval] = useState<BillingInterval>("month");
  const showPrices = !demo;

  return (
    <>
      {showPrices && (
      <div className="mt-8 flex justify-center">
        <div
          role="radiogroup"
          aria-label="Betaalperiode"
          className="inline-flex items-center rounded-full border border-border bg-background p-1 text-sm font-medium shadow-sm"
        >
          {(
            [
              { key: "month", label: "Maandelijks" },
              { key: "year", label: "Jaarlijks" },
            ] as const
          ).map((o) => (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={interval === o.key}
              onClick={() => setInterval(o.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 transition ${
                interval === o.key ? "bg-brand-600 text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      )}

      <div className={`${showPrices ? "mt-10" : "mt-12"} grid gap-6 md:grid-cols-3`}>
        {PLAN_ORDER.map((id) => PLANS[id]).map((plan) => {
          const featured = plan.id === "pro";
          return (
            <div
              key={plan.id}
              className={featured ? "rounded-2xl bg-brand-600 p-0.5 shadow-xl" : ""}
            >
              <div
                className={`relative flex h-full flex-col bg-background p-8 ${
                  featured ? "rounded-[15px]" : "rounded-2xl border border-border shadow-sm"
                }`}
              >
                {featured && (
                  <span className="absolute -top-3 left-8 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                    Populair
                  </span>
                )}
                <h3 className="text-lg font-semibold">
                  {plan.label} <span className="font-normal text-muted-foreground">({plan.audience})</span>
                </h3>
                <p className="mt-1 min-h-11 text-sm text-muted-foreground">{PLAN_TAGLINE[plan.id]}</p>
                {showPrices ? (
                <>
                <p className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    €{interval === "year" ? yearlyPerMonthEuros(plan) : plan.priceCents / 100}
                  </span>
                  <span className="text-sm text-muted-foreground">/ maand</span>
                </p>
                <p className="mt-1 min-h-5 text-sm text-muted-foreground">
                  {interval === "year" ? (
                    <>
                      {euro(plan.yearlyCents)} per jaar ·{" "}
                      <span className="text-muted-foreground/80 line-through">{euro(plan.priceCents * 12)}</span>
                    </>
                  ) : (
                    "Maandelijks opzegbaar"
                  )}
                </p>
                <p className="mt-2">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {interval === "year" ? "2 maanden gratis" : "Jaarlijks: 2 maanden gratis"}
                  </span>
                </p>
                </>
                ) : (
                  <p className="mt-5 text-sm font-semibold text-brand-700">Prijs in het demogesprek</p>
                )}
                <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                  {planFeatures(plan).map((f) => (
                    <li
                      key={f.text}
                      className={`flex gap-2.5 ${f.highlight ? "font-semibold text-brand-700" : ""}`}
                    >
                      <CheckIcon />
                      <span>
                        {f.text}
                        {f.scanInfo && <ScanInfo />}
                      </span>
                    </li>
                  ))}
                </ul>
                {demo && (
                  <PlanDemoButton href={demo.href} from={`pakket ${plan.id}`} className="mt-8 w-full" />
                )}
              </div>
            </div>
          );
        })}

        {/* Op maat: geen vaste prijs, in een gesprek afgesproken (bijv. Pro met extra scans). */}
        <div className="flex h-full flex-col rounded-2xl border border-dashed border-border bg-background/60 p-8">
          <h3 className="text-lg font-semibold">Op maat</h3>
          {showPrices && (
            <p className="mt-3 text-sm text-muted-foreground">
              vanaf <span className="text-2xl font-bold text-foreground">€{OP_MAAT_FROM_EUROS}</span> per maand
            </p>
          )}
          <p className="mt-1 min-h-11 text-sm text-muted-foreground">{PLAN_TAGLINE.premium}</p>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
            {[
              "Alles uit Pro",
              `Meer dan ${PLANS.pro.seats} gebruikers`,
              `Meer dan ${PLANS.pro.scans?.toLocaleString("nl-NL")} inboedelscans per maand`,
              "Een prijs die past bij wat je gebruikt",
            ].map((text) => (
              <li key={text} className="flex gap-2.5">
                <CheckIcon />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          {demo ? (
            <PlanDemoButton href={demo.href} from="pakket op maat" className="mt-8 w-full" />
          ) : (
            <a
              href={MORE_SEATS_MAILTO}
              className="mt-8 rounded-full border border-border px-6 py-3 text-center font-semibold text-foreground/80 hover:bg-muted"
            >
              Neem contact op
            </a>
          )}
        </div>
      </div>
    </>
  );
}
