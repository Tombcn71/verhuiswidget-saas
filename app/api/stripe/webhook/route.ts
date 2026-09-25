import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { syncSubscription } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Stripe meldt hier wijzigingen in abonnementen (afgesloten, plan gewisseld,
 * betaling mislukt, opgezegd). Staat buiten Clerk (zie `proxy.ts`); de
 * handtekening bewijst dat het van Stripe komt.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook niet geconfigureerd." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch (err) {
    console.error("Stripe-webhook: ongeldige handtekening", err);
    return NextResponse.json({ error: "Ongeldige handtekening." }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object);
      break;
  }

  return NextResponse.json({ received: true });
}
