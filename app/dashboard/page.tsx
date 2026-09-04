import type { Metadata } from "next";
import Link from "next/link";
import { requireCompany } from "@/lib/current-company";
import { normalizeServiceType } from "@/lib/companies";
import { getLeadStats, listLeadsForCompany } from "@/lib/leads";
import { formatEuroCents, formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Overzicht" };

export default async function DashboardOverviewPage() {
  const company = await requireCompany();
  const [stats, leads] = await Promise.all([
    getLeadStats(company.id),
    listLeadsForCompany(company.id, 5),
  ]);

  const serviceType = normalizeServiceType(company.serviceType);
  const cards = [
    { label: "Leads totaal", value: String(stats.total) },
    { label: "Laatste 30 dagen", value: String(stats.last30Days) },
    { label: "Openstaande waarde", value: formatEuroCents(stats.pipelineValueCents) },
    { label: "Gewonnen waarde", value: formatEuroCents(stats.wonValueCents) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overzicht</h1>
        <p className="mt-1 text-sm text-slate-600">Welkom terug bij {company.name}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">{c.label}</div>
            <div className="mt-1 text-2xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      {serviceType === "beide" && (
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/dashboard/leads?type=verhuizing"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 hover:border-brand-600"
          >
            <span className="font-semibold">{stats.verhuizingen}</span>{" "}
            <span className="text-slate-500">verhuizingen</span>
          </Link>
          <Link
            href="/dashboard/leads?type=ontruiming"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 hover:border-brand-600"
          >
            <span className="font-semibold">{stats.ontruimingen}</span>{" "}
            <span className="text-slate-500">ontruimingen</span>
          </Link>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold">Recente leads</h2>
          <Link href="/dashboard/leads" className="text-sm font-medium text-brand-600">
            Alles bekijken
          </Link>
        </div>
        {leads.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            Nog geen leads. Plaats de{" "}
            <Link href="/dashboard/embed" className="text-brand-600 underline">
              widget-link
            </Link>{" "}
            achter een knop op je website om aanvragen te ontvangen.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <li key={lead.id}>
                <Link
                  href={`/dashboard/leads/${lead.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                >
                  <div>
                    <div className="font-medium">{lead.customerName}</div>
                    <div className="text-sm text-slate-500">
                      {formatDateTime(lead.createdAt)} · {Number(lead.totalVolumeM3).toFixed(1)} m³
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatEuroCents(lead.totalCents)}</div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                      {lead.status}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
