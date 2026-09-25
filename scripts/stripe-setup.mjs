// Zet moverAI klaar in Stripe: producten + maandprijzen (met lookup keys) en
// het klantportaal (plan wisselen, opzeggen, facturen). Geen btw-tarief: B2B
// vanuit Spanje, de btw wordt verlegd naar de klant.
// Veilig om vaker te draaien: bestaande onderdelen worden hergebruikt.
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

// Houd gelijk met lib/plans.ts en lib/stripe.ts.
const PLANS = [
  { id: "moverai_basic", name: "moverAI Basic", cents: 7900 },
  { id: "moverai_standard", name: "moverAI Standard", cents: 12900 },
  { id: "moverai_premium", name: "moverAI Premium", cents: 19900 },
];
const EXTRA_SEAT = { id: "moverai_extra_seat", name: "moverAI extra gebruiker", cents: 1500 };

async function ensureProduct({ id, name }) {
  try {
    return await stripe.products.retrieve(id);
  } catch {
    return stripe.products.create({ id, name, tax_code: "txcd_10103001" }); // SaaS
  }
}

async function ensurePrice(product, { id, cents }) {
  const { data } = await stripe.prices.list({ lookup_keys: [id], active: true });
  if (data[0]) return data[0];
  return stripe.prices.create({
    product: product.id,
    lookup_key: id,
    currency: "eur",
    unit_amount: cents,
    recurring: { interval: "month" },
    tax_behavior: "exclusive",
  });
}

const env = {};

const planPrices = [];
for (const plan of PLANS) {
  const product = await ensureProduct(plan);
  const price = await ensurePrice(product, plan);
  planPrices.push({ product: product.id, prices: [price.id] });
  console.log(`✓ ${plan.name}: ${price.id}`);
}
const seatProduct = await ensureProduct(EXTRA_SEAT);
const seatPrice = await ensurePrice(seatProduct, EXTRA_SEAT);
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
const { data: configs } = await stripe.billingPortal.configurations.list({ is_default: true });
if (configs[0]) {
  await stripe.billingPortal.configurations.update(configs[0].id, { features: portalFeatures });
  console.log(`✓ Klantportaal bijgewerkt: ${configs[0].id}`);
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
