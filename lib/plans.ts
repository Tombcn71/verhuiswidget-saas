import type { Company } from "@/lib/db";

export type PlanId = "basic" | "standard" | "premium";

export type Plan = {
  id: PlanId;
  label: string;
  audience: string;
  priceCents: number; // per maand, excl. btw
  seats: number; // inbegrepen gebruikers
  extraSeatCents: number | null; // prijs per extra gebruiker per maand; null = niet mogelijk
  scans: number | null; // offerteaanvragen per maand; null = onbeperkt (fair use)
};

export const PLANS: Record<PlanId, Plan> = {
  basic: {
    id: "basic",
    label: "Basic",
    audience: "ZZP",
    priceCents: 7900,
    seats: 1,
    extraSeatCents: null,
    scans: 150,
  },
  standard: {
    id: "standard",
    label: "Standard",
    audience: "MKB",
    priceCents: 12900,
    seats: 3,
    extraSeatCents: null,
    scans: 500,
  },
  premium: {
    id: "premium",
    label: "Premium",
    audience: "Groeiende bedrijven",
    priceCents: 19900,
    seats: 5,
    extraSeatCents: 1500,
    scans: null,
  },
};

export const PLAN_ORDER: PlanId[] = ["basic", "standard", "premium"];

export function normalizePlan(value: unknown): PlanId {
  return value === "basic" || value === "premium" ? value : "standard";
}

export function planFor(company: Company): Plan {
  return PLANS[normalizePlan(company.plan)];
}

/** Het eerstvolgende plan met meer ruimte, of null bij Premium. */
export function nextPlan(plan: Plan): Plan | null {
  const next = PLAN_ORDER[PLAN_ORDER.indexOf(plan.id) + 1];
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
 * Proefperiode (14 dagen, zonder betaalkaart; default van `companies.trial_ends_at`)
 * zolang er geen betaald abonnement is. Stripe volgt in fase 4.
 */
export function trialState(company: Company, now = new Date()): TrialState {
  if (company.subscriptionStatus === "active") return { kind: "active" };
  const msLeft = company.trialEndsAt.getTime() - now.getTime();
  if (msLeft <= 0) return { kind: "expired" };
  return { kind: "trial", daysLeft: Math.ceil(msLeft / (24 * 60 * 60 * 1000)) };
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
