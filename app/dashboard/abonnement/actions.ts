"use server";

import { redirect } from "next/navigation";
import { requireAdminCompany } from "@/lib/current-company";
import { countMembers, setStripeCustomerId } from "@/lib/companies";
import { PLANS, normalizePlan } from "@/lib/plans";
import { PLAN_LOOKUP_KEY, getStripe, priceIdFor } from "@/lib/stripe";
import { appUrl } from "@/lib/app-url";

// Stripe wil een proef-einde minstens 48 uur vooruit; daaronder rekenen we meteen af.
const MIN_TRIAL_MS = 49 * 60 * 60 * 1000;

/**
 * Stuurt een admin naar Stripe Checkout voor het gekozen plan. Tijdens de proef
 * start de afschrijving pas als de proef voorbij is.
 */
export async function startCheckout(formData: FormData): Promise<void> {
  const company = await requireAdminCompany();
  const plan = PLANS[normalizePlan(formData.get("plan"))];

  // Al een lopend abonnement: wisselen gaat via het Stripe-portaal.
  if (company.stripeSubscriptionId) await openBillingPortal();

  const members = await countMembers(company);
  if (members > plan.seats) {
    redirect(`/dashboard/abonnement?fout=teamleden&plan=${plan.id}`);
  }

  const stripe = getStripe();
  let customerId = company.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: company.email,
      name: company.name,
      metadata: { companyId: company.id, clerkOrgId: company.clerkOrgId ?? "" },
    });
    customerId = customer.id;
    await setStripeCustomerId(company.id, customerId);
  }

  const trialMsLeft = company.trialEndsAt.getTime() - Date.now();
  const base = appUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: company.id,
    line_items: [{ price: await priceIdFor(PLAN_LOOKUP_KEY[plan.id]), quantity: 1 }],
    subscription_data: {
      metadata: { companyId: company.id },
      ...(trialMsLeft > MIN_TRIAL_MS
        ? { trial_end: Math.floor(company.trialEndsAt.getTime() / 1000) }
        : {}),
    },
    billing_address_collection: "required",
    // B2B vanuit Spanje: geen btw, die wordt verlegd naar de klant. Daarvoor is
    // een btw-nummer nodig; de factuur-voettekst in Stripe vermeldt de verlegging.
    tax_id_collection: { enabled: true, required: "if_supported" },
    customer_update: { address: "auto", name: "auto" },
    allow_promotion_codes: true,
    locale: "nl",
    success_url: `${base}/dashboard/abonnement?betaald=1`,
    cancel_url: `${base}/dashboard/abonnement`,
  });

  if (!session.url) throw new Error("Stripe gaf geen checkout-URL terug.");
  redirect(session.url);
}

/** Stripe-klantportaal: facturen, betaalmethode, plan wisselen, opzeggen. */
export async function openBillingPortal(): Promise<void> {
  const company = await requireAdminCompany();
  if (!company.stripeCustomerId) redirect("/dashboard/abonnement");

  const session = await getStripe().billingPortal.sessions.create({
    customer: company.stripeCustomerId,
    return_url: `${appUrl()}/dashboard/abonnement`,
    locale: "nl",
    // Alleen gezet als het setupscript een eigen portaalconfiguratie moest aanmaken.
    ...(process.env.STRIPE_PORTAL_CONFIG_ID
      ? { configuration: process.env.STRIPE_PORTAL_CONFIG_ID }
      : {}),
  });
  redirect(session.url);
}
