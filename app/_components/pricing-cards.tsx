"use client";

import { useState } from "react";
import Link from "next/link";
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

const PLAN_EXTRA: Record<PlanId, string> = {
  basic: "Tarieven volledig instelbaar: m³, km en toeslagen",
  standard: "Uitgebreid dashboard voor planners",
  premium: "Voorrang bij support",
};

function planFeatures(plan: Plan): string[] {
  const seats =
    plan.seats === 1
      ? "1 actieve gebruiker (seat)"
      : `Max. ${plan.seats} gebruikers (seats) om flexibel samen te werken`;
  const scans =
    plan.scans === null
      ? "Onbeperkt aantal AI-scans per maand"
      : `Inclusief ${plan.scans.toLocaleString("nl-NL")} AI-scans per maand${plan.fairUse ? " (fair use)" : ""}`;
  return [
    ...CHANNEL_FEATURES,
    seats,
    scans,
    "White-label: je eigen logo en huisstijlkleuren",
    PLAN_EXTRA[plan.id],
  ];
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

/** Prijskaarten van de homepage met de schakelaar Maandelijks / Jaarlijks. */
export function PricingCards({ primaryButton }: { primaryButton: string }) {
  const [interval, setInterval] = useState<BillingInterval>("month");

  return (
    <>
      <div className="mt-8 flex justify-center">
        <div
          role="radiogroup"
          aria-label="Betaalperiode"
          className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 text-sm font-medium shadow-sm"
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
                interval === o.key ? "bg-brand-600 text-white" : "text-slate-600 hover:text-slate-900"
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
                className={`relative flex h-full flex-col bg-white p-8 ${
                  featured ? "rounded-[15px]" : "rounded-2xl border border-slate-200 shadow-sm"
                }`}
              >
                {featured && (
                  <span className="absolute -top-3 left-8 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                    Populair
                  </span>
                )}
                <h3 className="text-lg font-semibold">
                  {plan.label} <span className="font-normal text-slate-500">({plan.audience})</span>
                </h3>
                <p className="mt-1 min-h-11 text-sm text-slate-600">{PLAN_TAGLINE[plan.id]}</p>
                <p className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    €{interval === "year" ? yearlyPerMonthEuros(plan) : plan.priceCents / 100}
                  </span>
                  <span className="text-sm text-slate-500">/ maand</span>
                </p>
                <p className="mt-1 min-h-5 text-sm text-slate-500">
                  {interval === "year" ? (
                    <>
                      {euro(plan.yearlyCents)} per jaar ·{" "}
                      <span className="text-slate-400 line-through">{euro(plan.priceCents * 12)}</span>
                    </>
                  ) : (
                    "Maandelijks opzegbaar"
                  )}
                </p>
                <p className="mt-1 text-sm font-medium text-emerald-700">
                  Eerste 2 weken gratis, zonder betaalkaart
                </p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-600">
                  {planFeatures(plan).map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <CheckIcon />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.id === "premium" && (
                  <p className="mt-4 text-sm text-slate-600">
                    Meer dan {plan.seats} gebruikers?{" "}
                    <a href={MORE_SEATS_MAILTO} className="font-medium text-brand-600 underline">
                      Neem contact op
                    </a>
                  </p>
                )}
                <Link
                  href={`/kies-plan?plan=${plan.id}`}
                  className={`mt-8 rounded-full px-6 py-3 text-center font-semibold ${
                    featured ? primaryButton : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Kies {plan.label}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
