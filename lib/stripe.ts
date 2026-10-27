import Stripe from "stripe";
import type { BillingInterval, PlanId } from "@/lib/plans";

let _stripe: Stripe | null = null;

/** Stripe-client; maakt lui verbinding zodat `next build` geen sleutel nodig heeft. */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY ontbreekt. Zet 'm in .env.local.");
  _stripe = new Stripe(key);
  return _stripe;
}

/**
 * Prijzen staan in Stripe met een vaste lookup key (aangemaakt door
 * `scripts/stripe-setup.mjs`), zodat er geen prijs-ID's in de env hoeven.
 */
export const PLAN_LOOKUP_KEY: Record<PlanId, string> = {
  basic: "moverai_basic",
  pro: "moverai_pro",
  // Op maat: niet te koop; oude prijs van vóór 2026-10-27. Een maatwerkprijs heeft
  // geen lookup key, dan blijft het plan staan dat je met de hand hebt gezet.
  premium: "moverai_premium",
};
export const EXTRA_SEAT_LOOKUP_KEY = "moverai_extra_seat";

/** Lookup key van de maand- of jaarprijs van een plan (jaar = `…_yearly`). */
export function lookupKeyFor(plan: PlanId, interval: BillingInterval): string {
  return interval === "year" ? `${PLAN_LOOKUP_KEY[plan]}_yearly` : PLAN_LOOKUP_KEY[plan];
}

export function planForLookupKey(key: string | null | undefined): PlanId | null {
  const base = key?.replace(/_yearly$/, "");
  if (base === "moverai_standard") return "pro"; // oude naam, vóór 2026-10-27
  const hit = Object.entries(PLAN_LOOKUP_KEY).find(([, k]) => k === base);
  return hit ? (hit[0] as PlanId) : null;
}

export async function priceIdFor(lookupKey: string): Promise<string> {
  const { data } = await getStripe().prices.list({ lookup_keys: [lookupKey], active: true });
  if (!data[0]) {
    throw new Error(`Geen Stripe-prijs met lookup key "${lookupKey}". Draai scripts/stripe-setup.mjs.`);
  }
  return data[0].id;
}

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

/**
 * Stripe-status → onze status. Een Stripe-"trialing" betekent dat er al een
 * betaalmethode is en de afschrijving na onze proef start: dat telt als betaald.
 */
export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    default:
      return "canceled";
  }
}
