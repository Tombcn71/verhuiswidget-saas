"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { requireAdminCompany } from "@/lib/current-company";
import { countMembers, deleteCompany, setStripeCustomerId } from "@/lib/companies";
import { listCompanyPhotoUrls } from "@/lib/leads";
import { PLANS, normalizeInterval, normalizePlan } from "@/lib/plans";
import { getStripe, lookupKeyFor, priceIdFor } from "@/lib/stripe";
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
  const interval = normalizeInterval(formData.get("interval"));

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
    line_items: [{ price: await priceIdFor(lookupKeyFor(plan.id, interval)), quantity: 1 }],
    // iDEAL (Stripe zet daar een SEPA-incasso op voor de volgende maanden, dus SEPA
    // Direct Debit moet in het dashboard aan blijven) en kaart, incl. Apple Pay en
    // Nederlandse bankpassen (Visa Debit / Debit Mastercard).
    payment_method_types: ["ideal", "card"],
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

/**
 * Opzeggen in de app (verhuizers vinden het Stripe-portaal eng): het abonnement
 * loopt door tot het einde van de betaalde periode of de proef. `doorgaan`
 * draait een opzegging terug.
 */
export async function setCancelAtPeriodEnd(formData: FormData): Promise<void> {
  const company = await requireAdminCompany();
  if (!company.stripeSubscriptionId) redirect("/dashboard/abonnement");
  const cancel = formData.get("doorgaan") !== "1";
  await getStripe().subscriptions.update(company.stripeSubscriptionId, {
    cancel_at_period_end: cancel,
  });
  revalidatePath("/dashboard/abonnement");
}

export type DeleteAccountState = { error?: string };

/**
 * Wist het account: abonnement direct stoppen (zonder terugbetaling), klantfoto's
 * weg, bedrijf + leads weg, Clerk-organisatie weg en de gebruiker zelf ook als
 * die geen ander bedrijf meer heeft. De Stripe-klant blijft voor de facturen.
 */
export async function deleteAccount(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const company = await requireAdminCompany();
  const typed = String(formData.get("naam") ?? "").trim().toLowerCase();
  if (typed !== company.name.trim().toLowerCase()) {
    return { error: "De naam klopt niet. Typ de naam van je bedrijf precies over." };
  }

  if (company.stripeCustomerId) {
    const stripe = getStripe();
    const { data } = await stripe.subscriptions.list({
      customer: company.stripeCustomerId,
      status: "all",
      limit: 20,
    });
    for (const sub of data) {
      if (sub.status !== "canceled" && sub.status !== "incomplete_expired") {
        await stripe.subscriptions.cancel(sub.id);
      }
    }
  }

  const photos = await listCompanyPhotoUrls(company.id);
  if (photos.length && process.env.BLOB_READ_WRITE_TOKEN) {
    for (let i = 0; i < photos.length; i += 500) await del(photos.slice(i, i + 500));
  }

  await deleteCompany(company.id);

  const { userId } = await auth();
  const client = await clerkClient();
  if (company.clerkOrgId) await client.organizations.deleteOrganization(company.clerkOrgId);
  if (userId) {
    const { totalCount } = await client.users.getOrganizationMembershipList({ userId });
    if (totalCount === 0) await client.users.deleteUser(userId);
  }

  redirect("/account-verwijderd");
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
