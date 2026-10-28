import type { Company } from "@/lib/db";

export type PlanId = "basic" | "pro" | "premium";

export type Plan = {
  id: PlanId;
  label: string;
  audience: string;
  priceCents: number; // per maand, excl. btw (maandelijks betalen)
  yearlyCents: number; // per jaar, excl. btw: 10 × maandprijs ("2 maanden gratis")
  seats: number; // inbegrepen gebruikers
  // Prijs per extra gebruiker per maand; null = niet mogelijk. Niet meer los te
  // koop: alleen op maat (contact), via het Stripe-abonnement. Telt wel mee in `seatLimit`.
  extraSeatCents: number | null;
  scans: number | null; // inboedelscans (= afgeronde aanvragen) per maand; null = onbeperkt
  fairUse?: boolean; // limiet is een fair-use-grens (Premium)
};

export type BillingInterval = "month" | "year";

/** "jaar" / "year" → jaarlijks; al het andere maandelijks. */
export function normalizeInterval(value: unknown): BillingInterval {
  return value === "year" || value === "jaar" ? "year" : "month";
}

/** Prijs per maand bij jaarlijks betalen, afgerond op hele euro's (alleen voor weergave). */
export function yearlyPerMonthEuros(plan: Plan): number {
  return Math.round(plan.yearlyCents / 12 / 100);
}

export const PLANS: Record<PlanId, Plan> = {
  basic: {
    id: "basic",
    label: "Basic",
    audience: "ZZP",
    priceCents: 6900,
    yearlyCents: 69000,
    seats: 2,
    extraSeatCents: null,
    scans: 100,
  },
  pro: {
    id: "pro",
    label: "Pro",
    audience: "MKB",
    priceCents: 9900,
    yearlyCents: 99000,
    seats: 5,
    extraSeatCents: null,
    scans: 500,
  },
  // Niet te koop op de site: "Op maat" (neem contact op). Voor een groot bedrijf
  // zet je dit plan met de hand, met een eigen prijs in Stripe.
  premium: {
    id: "premium",
    label: "Op maat",
    audience: "Op maat",
    priceCents: 0,
    yearlyCents: 0,
    seats: 10,
    extraSeatCents: 1900,
    scans: 1500,
    fairUse: true,
  },
};

/** De plannen die je zelf kunt kiezen (site, kies-plan, Abonnement). Premium = op maat. */
export const PLAN_ORDER: PlanId[] = ["basic", "pro"];

/** Contact voor maatwerk (meer gebruikers of meer scans dan Pro). */
export const CONTACT_EMAIL = "info@moverai.nl";
export const MORE_SEATS_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  "moverAI op maat",
)}`;

/** De drie kanalen; zitten in elk plan. */
export const CHANNEL_FEATURES = [
  "Via een linkje: stuur het via WhatsApp, sms of mail",
  "Via je website: de widget op je eigen site",
  "Zelf op locatie: scan ter plekke met je telefoon",
];

/** Onbekend of het oude "standard" (tot 2026-10-27) → Pro. */
export function normalizePlan(value: unknown): PlanId {
  return value === "basic" || value === "premium" ? value : "pro";
}

export function planFor(company: Company): Plan {
  return PLANS[normalizePlan(company.plan)];
}

/** Het eerstvolgende plan met meer ruimte, of null bij Pro en op maat (dan: contact). */
export function nextPlan(plan: Plan): Plan | null {
  const i = PLAN_ORDER.indexOf(plan.id);
  const next = i === -1 ? undefined : PLAN_ORDER[i + 1];
  return next ? PLANS[next] : null;
}

/** Maximaal aantal teamleden (Clerk `maxAllowedMemberships`). */
export function seatLimit(company: Company): number {
  const plan = planFor(company);
  return plan.seats + (plan.extraSeatCents === null ? 0 : company.extraSeats);
}

export type TrialState =
  | { kind: "trial"; daysLeft: number }
  | { kind: "expired" }
  | { kind: "active" };

/**
 * Proefperiode (14 dagen, zonder betaalgegevens; default van `companies.trial_ends_at`)
 * zolang er geen betaald abonnement is. Een mislukte betaling (`past_due`) houdt
 * toegang; Stripe probeert het zelf opnieuw en de melding vraagt om actie.
 */
export function trialState(company: Company, now = new Date()): TrialState {
  if (company.subscriptionStatus === "active" || company.subscriptionStatus === "past_due") {
    return { kind: "active" };
  }
  const msLeft = company.trialEndsAt.getTime() - now.getTime();
  if (msLeft <= 0) return { kind: "expired" };
  return { kind: "trial", daysLeft: Math.ceil(msLeft / (24 * 60 * 60 * 1000)) };
}

/** Of het bedrijf het dashboard volledig mag gebruiken (proef of betaald). */
export function hasAccess(company: Company): boolean {
  return trialState(company).kind !== "expired";
}

/**
 * Na een verlopen proef zonder betaling blijft de widget werken, maar zijn leads
 * van ná de proef afgeschermd tot er betaald is. Oudere leads blijven zichtbaar.
 */
export function isLeadLocked(company: Company, lead: { createdAt: Date }): boolean {
  return !hasAccess(company) && lead.createdAt > company.trialEndsAt;
}

export type ScanUsage = {
  used: number;
  limit: number | null;
  /** 0–1+, null bij onbeperkt. */
  ratio: number | null;
  over: boolean;
  nearLimit: boolean; // ≥ 80%
};

/**
 * Een scan = een offerteaanvraag. De limiet is zacht: er wordt nooit geblokkeerd,
 * alleen een upgrade aangeboden.
 */
export function scanUsage(company: Company, used: number): ScanUsage {
  const limit = planFor(company).scans;
  if (limit === null) return { used, limit, ratio: null, over: false, nearLimit: false };
  const ratio = used / limit;
  return { used, limit, ratio, over: used > limit, nearLimit: ratio >= 0.8 };
}
