import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCompanyById } from "@/lib/companies";
import { getLeadForBooking } from "@/lib/leads";
import { formatDate, formatDateTime, formatEuroCents } from "@/lib/format";
import { confirmBooking } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Boeking bevestigen", robots: { index: false } };

/**
 * Bevestigingspagina achter de knop "Ja, ik wil boeken" in de offerte-mail en
 * de widget. In de huisstijl van de verhuizer (white-label).
 */
export default async function BookingPage({
  params,
  searchParams,
}: PageProps<"/boeken/[leadId]">) {
  const [{ leadId }, { t }] = await Promise.all([params, searchParams]);
  const token = typeof t === "string" ? t : "";
  const lead = await getLeadForBooking(leadId, token);
  if (!lead) notFound();
  const company = await getCompanyById(lead.companyId);
  if (!company) notFound();

  const what = lead.moveType === "ontruiming" ? "ontruiming" : "verhuizing";
  const accepted = lead.acceptedAt !== null || lead.status === "gewonnen";
  const closed = lead.status === "verloren";

  return (
    <div
      className="flex min-h-dvh items-start justify-center bg-slate-50 px-4 py-10 sm:items-center"
      style={{ "--accent": company.primaryColor } as React.CSSProperties}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-8">
        <div className="flex justify-center">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- extern logo (Blob)
            <img src={company.logoUrl} alt={company.name} className="h-12 max-w-52 object-contain" />
          ) : (
            <p className="text-lg font-bold">{company.name}</p>
          )}
        </div>

        {closed ? (
          <div className="mt-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Deze offerte is verlopen</h1>
            <p className="mt-2 text-slate-600">
              Neem contact op met {company.name} voor een nieuwe offerte
              {company.phone ? ` (${company.phone})` : ""}.
            </p>
          </div>
        ) : accepted ? (
          <div className="mt-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-3xl">
              ✓
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Bedankt, {lead.customerName}!</h1>
            <p className="mt-2 text-slate-600">
              {company.name} heeft je boeking ontvangen
              {lead.acceptedAt ? ` (${formatDateTime(lead.acceptedAt)})` : ""} en neemt contact
              met je op om de details te bevestigen.
            </p>
          </div>
        ) : (
          <>
            <h1 className="mt-8 text-center text-2xl font-bold tracking-tight">
              Je {what} boeken bij {company.name}
            </h1>
            <p className="mt-2 text-center text-slate-600">
              Controleer de gegevens en bevestig. {company.name} neemt daarna contact met je op om
              de details definitief te maken.
            </p>

            <dl className="mt-6 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">
              {lead.fromAddress && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">{lead.toAddress ? "Van" : "Adres"}</dt>
                  <dd className="text-right font-medium">{lead.fromAddress}</dd>
                </div>
              )}
              {lead.toAddress && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Naar</dt>
                  <dd className="text-right font-medium">{lead.toAddress}</dd>
                </div>
              )}
              {lead.moveDate && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Datum</dt>
                  <dd className="font-medium">{formatDate(lead.moveDate)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 text-base">
                <dt className="font-semibold">Prijsindicatie</dt>
                <dd className="font-bold">{formatEuroCents(lead.totalCents)}</dd>
              </div>
              <p className="text-xs text-slate-500">Incl. btw. De definitieve prijs bevestigt {company.name} met je.</p>
            </dl>

            <form action={confirmBooking} className="mt-6">
              <input type="hidden" name="leadId" value={lead.id} />
              <input type="hidden" name="t" value={token} />
              <button
                type="submit"
                className="w-full rounded-full bg-(--accent) px-6 py-3.5 font-semibold text-white shadow-md transition hover:brightness-95"
              >
                Bevestig mijn boeking
              </button>
            </form>
            {company.phone && (
              <p className="mt-4 text-center text-sm text-slate-500">
                Liever eerst even bellen?{" "}
                <a href={`tel:${company.phone}`} className="font-medium underline">
                  {company.phone}
                </a>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
