import type { Metadata } from "next";
import Link from "next/link";
import { requireCompany } from "@/lib/current-company";
import { normalizeServiceType } from "@/lib/companies";
import { listLeadsForCompany } from "@/lib/leads";
import { formatEuroCents, formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Leads" };

const FILTERS = [
  { key: "", label: "Alles" },
  { key: "verhuizing", label: "Verhuizingen" },
  { key: "ontruiming", label: "Ontruimingen" },
] as const;

export default async function LeadsPage({
  searchParams,
}: PageProps<"/dashboard/leads">) {
  const company = await requireCompany();
  const serviceType = normalizeServiceType(company.serviceType);

  const { type } = await searchParams;
  const active =
    type === "verhuizing" || type === "ontruiming" ? type : undefined;

  const leads = await listLeadsForCompany(company.id, 100, active);
  const showFilter = serviceType === "beide";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Leads</h1>

      {showFilter && (
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
          {FILTERS.map((f) => {
            const isActive = (active ?? "") === f.key;
            return (
              <Link
                key={f.key}
                href={f.key ? `/dashboard/leads?type=${f.key}` : "/dashboard/leads"}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      )}

      {leads.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          {active
            ? "Geen aanvragen in deze categorie."
            : "Nog geen aanvragen ontvangen."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Klant</th>
                <th className="px-4 py-3 font-medium">Datum</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Volume</th>
                <th className="px-4 py-3 text-right font-medium">Bedrag</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {lead.customerName}
                    </Link>
                    <div className="text-xs text-slate-500">{lead.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(lead.createdAt)}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{lead.moveType}</td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {Number(lead.totalVolumeM3).toFixed(1)} m³
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatEuroCents(lead.totalCents)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
                      {lead.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
