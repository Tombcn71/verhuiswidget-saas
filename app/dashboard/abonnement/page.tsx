import type { Metadata } from "next";
import { requireAdminCompany } from "@/lib/current-company";
import { refreshFromStripe } from "@/lib/billing";
import { countMembers } from "@/lib/companies";
import { countLeadsThisMonth } from "@/lib/leads";
import { CHANNEL_FEATURES, PLANS, PLAN_ORDER, normalizePlan, planFor, scanUsage, seatLimit, trialState } from "@/lib/plans";
import { formatDate, formatEuroCents } from "@/lib/format";
import { UsageBar } from "../usage-bar";
import { openBillingPortal, startCheckout } from "./actions";

export const metadata: Metadata = { title: "Abonnement" };

export default async function SubscriptionPage({
  searchParams,
}: PageProps<"/dashboard/abonnement">) {
  // Altijd de actuele stand uit Stripe, ook als de webhook nog niet binnen is.
  const company = await refreshFromStripe(await requireAdminCompany());
  const [used, members, { fout, plan: wanted, betaald }] = await Promise.all([
    countLeadsThisMonth(company.id),
    countMembers(company),
    searchParams,
  ]);

  const plan = planFor(company);
  const usage = scanUsage(company, used);
  const trial = trialState(company);
  // Met een lopend Stripe-abonnement gaat alles (wisselen, opzeggen) via het portaal.
  const subscribed = company.stripeSubscriptionId !== null;
  const pastDue = company.subscriptionStatus === "past_due";

  const error =
    fout === "teamleden"
      ? `Je team heeft ${members} leden; ${PLANS[normalizePlan(wanted)].label} staat er maximaal ${PLANS[normalizePlan(wanted)].seats} toe. Verwijder eerst teamleden.`
      : pastDue
        ? "Je laatste betaling is mislukt. Werk je betaalmethode bij via 'Abonnement beheren'; Stripe probeert het automatisch opnieuw."
        : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abonnement</h1>
        <p className="mt-1 text-sm text-slate-600">
          {trial.kind === "trial" &&
            `Proefperiode: nog ${trial.daysLeft} ${trial.daysLeft === 1 ? "dag" : "dagen"} (tot ${formatDate(company.trialEndsAt)}). Activeer nu een plan en je betaalt pas als je proef voorbij is.`}
          {trial.kind === "expired" &&
            "Je proefperiode is afgelopen. Nieuwe aanvragen komen nog gewoon binnen; je ziet ze zodra je een plan activeert."}
          {trial.kind === "active" && `Je zit op ${plan.label}.`}
        </p>
        {subscribed && (
          <form action={openBillingPortal} className="mt-4">
            <button
              type="submit"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Abonnement beheren
            </button>
            <span className="ml-3 text-xs text-slate-500">
              Facturen, betaalmethode, plan wisselen of opzeggen
            </span>
          </form>
        )}
      </div>

      {betaald !== undefined && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Gelukt, bedankt! Je abonnement wordt geactiveerd — dat kan een minuutje duren.
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Offerteaanvragen deze maand</div>
          <UsageBar usage={usage} className="mt-2" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Gebruikers</div>
          <div className="mt-1 text-2xl font-bold">
            {members} / {seatLimit(company)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          const current = p.id === plan.id;
          return (
            <form
              key={p.id}
              action={subscribed ? openBillingPortal : startCheckout}
              className={`flex flex-col rounded-xl border bg-white p-5 ${
                current ? "border-brand-600 ring-1 ring-brand-600" : "border-slate-200"
              }`}
            >
              <input type="hidden" name="plan" value={p.id} />
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold">{p.label}</h2>
                <span className="text-xs text-slate-500">{p.audience}</span>
              </div>
              <div className="mt-2 text-2xl font-bold">
                {formatEuroCents(p.priceCents)}
                <span className="text-sm font-normal text-slate-500"> /mnd excl. btw</span>
              </div>
              <ul className="mt-4 flex-1 space-y-1 text-sm text-slate-600">
                <li>
                  {p.seats === 1 ? "1 gebruiker" : `Tot ${p.seats} gebruikers`}
                  {p.extraSeatCents !== null &&
                    ` (extra: ${formatEuroCents(p.extraSeatCents)}/mnd)`}
                </li>
                <li>
                  {p.scans === null
                    ? "Onbeperkt offerteaanvragen (fair use)"
                    : `${p.scans} offerteaanvragen per maand`}
                </li>
                {CHANNEL_FEATURES.map((f) => (
                  <li key={f}>{f}</li>
                ))}
                <li>Verhuizen én ontruimen</li>
              </ul>
              <button
                type="submit"
                disabled={subscribed && current}
                className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {subscribed
                  ? current
                    ? "Huidig plan"
                    : `Wissel naar ${p.label}`
                  : `Activeer ${p.label}`}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
