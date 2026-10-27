// Zet moverAI klaar in Stripe: producten + maand- en jaarprijzen (met lookup
// keys) en het klantportaal (plan/periode wisselen, opzeggen, facturen). Geen
// btw-tarief: B2B vanuit Spanje, de btw wordt verlegd naar de klant.
// Veilig om vaker te draaien: bestaande onderdelen worden hergebruikt. Is een
// bedrag gewijzigd, dan komt er een nieuwe prijs die de lookup key overneemt;
// bestaande abonnementen houden hun oude prijs.
//
//   node --env-file=.env.local scripts/stripe-setup.mjs
//   node --env-file=.env.local scripts/stripe-setup.mjs https://jouwdomein.nl/api/stripe/webhook
//
// Met een URL erbij maakt het ook het webhook-endpoint aan (voor productie) en
// print het de STRIPE_WEBHOOK_SECRET. Lokaal gebruik je de Stripe CLI:
//   stripe listen --forward-to localhost:3000/api/stripe/webhook

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY ontbreekt (zet 'm in .env.local).");
  process.exit(1);
}
const stripe = new Stripe(key);
const webhookUrl = process.argv[2];

// Houd gelijk met lib/plans.ts en lib/stripe.ts. Jaar = 10 × maand ("2 maanden gratis").
const PLANS = [
  { id: "moverai_basic", name: "moverAI Basic", cents: 6900, yearlyCents: 69000 },
  { id: "moverai_pro", name: "moverAI Pro", cents: 9900, yearlyCents: 99000 },
];
// Niet meer te koop (Standard heet sinds 2026-10-27 Pro; Premium is "op maat"):
// prijzen en product uitzetten. Lopende abonnementen houden hun prijs.
const RETIRED = ["moverai_standard", "moverai_premium"];
const EXTRA_SEAT = { id: "moverai_extra_seat", name: "moverAI extra gebruiker", cents: 1900 };

async function ensureProduct({ id, name }) {
  try {
    const product = await stripe.products.retrieve(id);
    // Naam zoals de klant hem ziet bij afrekenen en op de factuur.
    return product.name === name && product.active
      ? product
      : stripe.products.update(id, { name, active: true });
  } catch {
    return stripe.products.create({ id, name, tax_code: "txcd_10103001" }); // SaaS
  }
}

async function ensurePrice(product, lookupKey, cents, interval) {
  const { data } = await stripe.prices.list({ lookup_keys: [lookupKey], active: true });
  const existing = data[0];
  if (existing && existing.unit_amount === cents && existing.recurring?.interval === interval) {
    return existing;
  }
  // Nieuw, of bedrag gewijzigd: nieuwe prijs die de lookup key overneemt.
  const price = await stripe.prices.create({
    product: product.id,
    lookup_key: lookupKey,
    transfer_lookup_key: true,
    currency: "eur",
    unit_amount: cents,
    recurring: { interval },
    tax_behavior: "exclusive",
  });
  // Oude prijs niet meer aanbieden aan nieuwe klanten (lopende abonnementen blijven).
  if (existing) await stripe.prices.update(existing.id, { active: false });
  return price;
}

const env = {};

const planPrices = [];
for (const plan of PLANS) {
  const product = await ensureProduct(plan);
  const monthly = await ensurePrice(product, plan.id, plan.cents, "month");
  const yearly = await ensurePrice(product, `${plan.id}_yearly`, plan.yearlyCents, "year");
  planPrices.push({ product: product.id, prices: [monthly.id, yearly.id] });
  console.log(`✓ ${plan.name}: maand ${monthly.id} · jaar ${yearly.id}`);
}
for (const id of RETIRED) {
  for (const key of [id, `${id}_yearly`]) {
    const { data } = await stripe.prices.list({ lookup_keys: [key], active: true });
    for (const price of data) await stripe.prices.update(price.id, { active: false });
  }
  try {
    await stripe.products.update(id, { active: false });
    console.log(`✓ Uitgezet: ${id}`);
  } catch {
    // bestond niet
  }
}
const seatProduct = await ensureProduct(EXTRA_SEAT);
const seatPrice = await ensurePrice(seatProduct, EXTRA_SEAT.id, EXTRA_SEAT.cents, "month");
console.log(`✓ ${EXTRA_SEAT.name}: ${seatPrice.id}`);

// Klantportaal: facturen, betaalmethode, gegevens, plan wisselen en opzeggen.
const portalFeatures = {
  invoice_history: { enabled: true },
  payment_method_update: { enabled: true },
  customer_update: { enabled: true, allowed_updates: ["address", "name", "email", "tax_id"] },
  subscription_cancel: { enabled: true, mode: "at_period_end" },
  subscription_update: {
    enabled: true,
    default_allowed_updates: ["price"],
    products: planPrices,
    proration_behavior: "create_prorations",
  },
};
// Bestaand portaal bijwerken: eerst dat uit de env, anders het standaardportaal.
const { data: configs } = await stripe.billingPortal.configurations.list({ is_default: true });
const existingPortal = process.env.STRIPE_PORTAL_CONFIG_ID || configs[0]?.id;
if (existingPortal) {
  await stripe.billingPortal.configurations.update(existingPortal, { features: portalFeatures });
  console.log(`✓ Klantportaal bijgewerkt: ${existingPortal}`);
} else {
  const config = await stripe.billingPortal.configurations.create({ features: portalFeatures });
  env.STRIPE_PORTAL_CONFIG_ID = config.id;
  console.log(`✓ Klantportaal aangemaakt: ${config.id}`);
}

if (webhookUrl) {
  const endpoint = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: [
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ],
  });
  env.STRIPE_WEBHOOK_SECRET = endpoint.secret;
  console.log(`✓ Webhook: ${endpoint.url}`);
}

if (Object.keys(env).length > 0) {
  console.log("\nZet dit in je env (.env.local en/of Vercel):\n");
  for (const [k, v] of Object.entries(env)) console.log(`${k}=${v}`);
}
