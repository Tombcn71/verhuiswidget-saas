import type { Metadata } from "next";
import { requireAdminCompany } from "@/lib/current-company";
import { countMembers } from "@/lib/companies";
import { countLeadsThisMonth } from "@/lib/leads";
import { PLANS, PLAN_ORDER, normalizePlan, planFor, scanUsage, seatLimit, trialState } from "@/lib/plans";
import { formatDate, formatEuroCents } from "@/lib/format";
import { UsageBar } from "../usage-bar";
import { choosePlan } from "./actions";

export const metadata: Metadata = { title: "Abonnement" };

export default async function SubscriptionPage({
  searchParams,
}: PageProps<"/dashboard/abonnement">) {
  const company = await requireAdminCompany();
  const [used, members, { fout, plan: wanted }] = await Promise.all([
    countLeadsThisMonth(company.id),
    countMembers(company),
    searchParams,
  ]);

  const plan = planFor(company);
  const usage = scanUsage(company, used);
  const trial = trialState(company);
  const canSwitch = trial.kind === "trial";

  const error =
    fout === "teamleden"
      ? `Je team heeft ${members} leden; ${PLANS[normalizePlan(wanted)].label} staat er maximaal ${PLANS[normalizePlan(wanted)].seats} toe. Verwijder eerst teamleden.`
      : fout === "betalen"
        ? "Van plan wisselen na de proefperiode kan zodra online betalen live is. Neem tot die tijd contact met ons op."
        : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abonnement</h1>
        <p className="mt-1 text-sm text-slate-600">
          {trial.kind === "trial" &&
            `Proefperiode: nog ${trial.daysLeft} ${trial.daysLeft === 1 ? "dag" : "dagen"} (tot ${formatDate(company.trialEndsAt)}). Je kunt vrij van plan wisselen.`}
          {trial.kind === "expired" && "Je proefperiode is afgelopen."}
          {trial.kind === "active" && `Je zit op ${plan.label}.`}
        </p>
      </div>

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
              action={choosePlan}
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
                <li>Widget, links en zelf scannen</li>
                <li>Verhuizen én ontruimen</li>
              </ul>
              <button
                type="submit"
                disabled={current || !canSwitch}
                className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {current ? "Huidig plan" : canSwitch ? `Kies ${p.label}` : "Binnenkort"}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
