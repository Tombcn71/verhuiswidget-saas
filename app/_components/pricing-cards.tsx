"use client";

import { useState } from "react";
import Link from "next/link";
import { ScanInfo } from "@/app/_components/scan-info";
import {
  CHANNEL_FEATURES,
  MORE_SEATS_MAILTO,
  PLANS,
  PLAN_ORDER,
  yearlyPerMonthEuros,
  type BillingInterval,
  type Plan,
  type PlanId,
} from "@/lib/plans";

// Teksten per plan; aantallen (gebruikers, scans, prijzen) komen uit `lib/plans.ts`.
const PLAN_TAGLINE: Record<PlanId, string> = {
  basic: "Voor de zelfstandige verhuizer die direct professioneel wil scannen.",
  standard: "Voor groeiende verhuisbedrijven met een kantoor- of planningsteam.",
  premium: "Voor de grotere verhuisketens met meerdere planners en taxateurs op de weg.",
};

type Feature = {
  text: string;
  /** Verschilt per plan: blauw en vet, zodat je kaarten horizontaal vergelijkt. */
  highlight?: boolean;
  scanInfo?: boolean;
};

/**
 * Basic toont alles; Standard en Premium alleen wat ze extra hebben, onder
 * "Alles uit …, plus:" (zie `PLAN_BASE`).
 */
function planFeatures(plan: Plan): Feature[] {
  const seats: Feature = {
    text: `${plan.seats} gebruikers${plan.id === "standard" ? " om flexibel samen te werken" : ""}`,
    highlight: true,
  };
  const scans: Feature = {
    text: `${plan.scans === null ? "Onbeperkt" : plan.scans.toLocaleString("nl-NL")} inboedelscans per maand${plan.fairUse ? " (fair use)" : ""}`,
    highlight: true,
    scanInfo: true,
  };
  if (plan.id === "standard") {
    return [seats, scans, { text: "Uitgebreid dashboard voor planners" }];
  }
  if (plan.id === "premium") {
    return [seats, scans, { text: "Voorrang bij support" }];
  }
  return [
    seats,
    scans,
    ...CHANNEL_FEATURES.map((text) => ({ text })),
    { text: "White-label: je eigen bedrijfsnaam en huisstijlkleur" },
    { text: "Tarieven volledig instelbaar: m³, km en toeslagen" },
    { text: "Automatische herinnering bij openstaande offertes" },
    { text: "Automatisch reviewverzoek na de verhuizing" },
  ];
}

/** Het pakket waar Standard en Premium op voortbouwen. */
const PLAN_BASE: Partial<Record<PlanId, string>> = {
  standard: "Basic",
  premium: "Standard",
};

/** "Zo werkt je proefperiode": staat boven de pakketten op de homepage. */
export function TrialCard({ primaryButton }: { primaryButton: string }) {
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
      <Link
        href="/kies-plan?plan=standard"
        className={`mt-6 inline-block w-full rounded-full px-6 py-3 text-center font-semibold sm:w-auto ${primaryButton}`}
      >
        Start je gratis proefperiode
      </Link>
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
 * Prijskaarten van de homepage met de schakelaar Maandelijks / Jaarlijks. Zonder
 * knoppen: starten gaat via `TrialCard`, het pakket kies je pas na de proef.
 */
export function PricingCards() {
  const [interval, setInterval] = useState<BillingInterval>("month");

  return (
    <>
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
              {o.key === "year" && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    interval === "year" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  2 maanden gratis
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {PLAN_ORDER.map((id) => PLANS[id]).map((plan) => {
          const featured = plan.id === "standard";
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
                <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                  {PLAN_BASE[plan.id] && (
                    <li className="font-semibold text-foreground">Alles uit {PLAN_BASE[plan.id]}, plus:</li>
                  )}
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
                {plan.id === "premium" && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Meer dan {plan.seats} gebruikers?{" "}
                    <a href={MORE_SEATS_MAILTO} className="font-medium text-brand-600 underline">
                      Neem contact op
                    </a>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
