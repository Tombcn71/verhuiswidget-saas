import type Stripe from "stripe";
import {
  applySubscription,
  getCompanyById,
  getCompanyByStripeCustomerId,
} from "@/lib/companies";
import type { Company } from "@/lib/db";
import {
  EXTRA_SEAT_LOOKUP_KEY,
  getStripe,
  mapStripeStatus,
  planForLookupKey,
} from "@/lib/stripe";

/**
 * Zet de stand van een Stripe-abonnement op het bedrijf (plan, status, extra
 * gebruikers). Gebruikt door de webhook én door `refreshFromStripe`.
 */
export async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const company =
    (sub.metadata.companyId ? await getCompanyById(sub.metadata.companyId) : null) ??
    (await getCompanyByStripeCustomerId(customerId));
  if (!company) {
    console.error("Stripe: geen bedrijf voor abonnement", sub.id);
    return;
  }

  // Een oud (opgezegd) abonnement mag een nieuwer abonnement niet overschrijven.
  if (company.stripeSubscriptionId && company.stripeSubscriptionId !== sub.id) {
    if (mapStripeStatus(sub.status) === "canceled") return;
  }

  let plan = null;
  let extraSeats = 0;
  for (const item of sub.items.data) {
    plan ??= planForLookupKey(item.price.lookup_key);
    if (item.price.lookup_key === EXTRA_SEAT_LOOKUP_KEY) extraSeats = item.quantity ?? 0;
  }

  const status = mapStripeStatus(sub.status);
  await applySubscription(company.id, {
    ...(plan ? { plan } : {}),
    subscriptionStatus: status,
    stripeSubscriptionId: status === "canceled" ? null : sub.id,
    extraSeats: status === "canceled" ? 0 : extraSeats,
  });
}

/**
 * Haalt de actuele stand direct bij Stripe op (nieuwste abonnement van de klant).
 * Zo klopt de Abonnement-pagina ook als de webhook (nog) niet binnen is —
 * bijvoorbeeld lokaal zonder Stripe CLI. Geeft het bijgewerkte bedrijf terug.
 */
export async function refreshFromStripe(company: Company): Promise<Company> {
  if (!company.stripeCustomerId || !process.env.STRIPE_SECRET_KEY) return company;
  try {
    const { data } = await getStripe().subscriptions.list({
      customer: company.stripeCustomerId,
      status: "all",
      limit: 1,
    });
    if (data[0]) await syncSubscription(data[0]);
  } catch (err) {
    console.error("Stripe: verversen mislukt", err);
    return company;
  }
  return (await getCompanyById(company.id)) ?? company;
}
