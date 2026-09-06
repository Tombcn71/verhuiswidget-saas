import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompany } from "@/lib/current-company";
import { getLeadForCompany } from "@/lib/leads";
import { formatEuroCents, formatDate, formatDateTime } from "@/lib/format";
import { setLeadStatus, saveLeadNotes } from "./actions";

export const metadata: Metadata = { title: "Lead" };

const STATUSES = ["nieuw", "gecontacteerd", "gewonnen", "verloren"] as const;

export default async function LeadDetailPage({
  params,
}: PageProps<"/dashboard/leads/[id]">) {
  const { id } = await params;
  const company = await requireCompany();
  const lead = await getLeadForCompany(company.id, id);
  if (!lead) notFound();

  const isClearance = lead.moveType === "ontruiming";
  const md = lead.move ?? {};
  const cl = lead.clearance;
  const propertyType = isClearance ? cl?.propertyType : md.propertyType;
  const roomCount = isClearance ? cl?.roomCount : md.roomCount;
  const hasElevator = isClearance ? cl?.hasElevator : md.hasElevator;
  const streetAccessible = isClearance ? cl?.streetAccessible : md.streetAccessible;
  const yesNo = (b: boolean | undefined) => (b === undefined ? "—" : b ? "Ja" : "Nee");

  const billableVolume = Math.max(1, Math.ceil(Number(lead.totalVolumeM3)));
  const estimatedTrips = Math.max(
    1,
    Math.ceil(billableVolume / (company.truckCapacityM3 || 20)),
  );

  const rows: Array<[string, string]> = [
    ["E-mail", lead.customerEmail],
    ["Telefoon", lead.customerPhone ?? "—"],
    ["Type", lead.moveType],
    [isClearance ? "Ontruimadres" : "Van", lead.fromAddress ?? "—"],
    ...(isClearance ? [] : ([["Naar", lead.toAddress ?? "—"]] as Array<[string, string]>)),
    ["Etage", isClearance ? (lead.fromFloor ?? "—") : `${lead.fromFloor ?? "—"} → ${lead.toFloor ?? "—"}`],
    ...(propertyType ? ([["Woningtype", propertyType]] as Array<[string, string]>) : []),
    ...(roomCount ? ([["Aantal kamers", String(roomCount)]] as Array<[string, string]>) : []),
    ["Lift aanwezig", yesNo(hasElevator)],
    ["Bereikbaar voor de wagen", yesNo(streetAccessible)],
    [isClearance ? "Gewenste datum" : "Verhuisdatum", formatDate(lead.moveDate)],
    ...(isClearance ? [] : ([["Afstand", `${Math.round(Number(lead.distanceKm))} km`]] as Array<[string, string]>)),
    ["Totaal volume", `${Number(lead.totalVolumeM3).toFixed(1)} m³`],
    ["Geschat aantal ritten", `${estimatedTrips}× (wagen ${company.truckCapacityM3} m³)`],
    ["Aangevraagd op", formatDateTime(lead.createdAt)],
  ];

  const options = lead.options ?? {};
  const works = cl?.works;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/leads" className="text-sm text-brand-600">
          ← Terug naar leads
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{lead.customerName}</h1>
      </div>

      <form action={setLeadStatus} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="leadId" value={lead.id} />
        <span className="text-sm text-slate-500">Status:</span>
        {STATUSES.map((s) => (
          <button
            key={s}
            name="status"
            value={s}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
              lead.status === s
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {s}
          </button>
        ))}
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">Gegevens</h2>
          <dl className="mt-4 space-y-2 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right font-medium capitalize">{v}</dd>
              </div>
            ))}
          </dl>
          {(options.packing || options.assembly || (options.storageMonths ?? 0) > 0) && (
            <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
              <div className="text-slate-500">Extra opties</div>
              <ul className="mt-1 list-inside list-disc">
                {options.packing && <li>Inpakservice</li>}
                {options.assembly && <li>Meubelmontage en -demontage</li>}
                {(options.storageMonths ?? 0) > 0 && (
                  <li>Opslag: {options.storageMonths} maand(en)</li>
                )}
              </ul>
            </div>
          )}
          {works && (
            <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
              <div className="text-slate-500">Extra werkzaamheden</div>
              <ul className="mt-1 list-inside list-disc">
                {works.floorRemoval && (
                  <li>
                    Vloer verwijderen ({works.floorRemoval.type}) — {works.floorRemoval.m2} m²
                  </li>
                )}
                {(works.wallpaperM2 ?? 0) > 0 && <li>Behang verwijderen — {works.wallpaperM2} m²</li>}
                {(works.holes ?? 0) > 0 && <li>Gaatjes stoppen — {works.holes} stuks</li>}
                {(works.paintingM2 ?? 0) > 0 && <li>Schilderwerk — {works.paintingM2} m²</li>}
                {works.curtains && <li>Gordijnen verwijderen</li>}
                {works.packing && <li>Inpakservice</li>}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">Prijsopbouw</h2>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {(lead.priceBreakdown ?? []).map((line, i) => (
                <tr key={i}>
                  <td className="py-1 text-slate-600">{line.label}</td>
                  <td className="py-1 text-right">{formatEuroCents(line.amountCents)}</td>
                </tr>
              ))}
              <tr className="border-t border-slate-200">
                <td className="py-1 text-slate-600">Subtotaal</td>
                <td className="py-1 text-right">{formatEuroCents(lead.subtotalCents)}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-600">Btw</td>
                <td className="py-1 text-right">{formatEuroCents(lead.vatCents)}</td>
              </tr>
              <tr className="border-t-2 border-slate-900 font-bold">
                <td className="py-2">Totaal incl. btw</td>
                <td className="py-2 text-right">{formatEuroCents(lead.totalCents)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Notitie</h2>
        <form action={saveLeadNotes} className="mt-3">
          <input type="hidden" name="leadId" value={lead.id} />
          <textarea
            name="notes"
            rows={3}
            defaultValue={lead.notes ?? ""}
            placeholder="Bijv. gebeld op 12/3, komt langs voor bezichtiging…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600"
          />
          <button
            type="submit"
            className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Notitie opslaan
          </button>
        </form>
      </section>

      {(lead.photoUrls ?? []).length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">
            Foto&apos;s van de klant{" "}
            <span className="text-slate-400">({lead.photoUrls.length})</span>
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {lead.photoUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Foto ${i + 1}`}
                  className="h-28 w-28 rounded-lg object-cover ring-1 ring-slate-200"
                />
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">
          Inventarislijst <span className="text-slate-400">({lead.inventory?.length ?? 0} regels)</span>
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2 font-medium">Object</th>
                <th className="py-2 font-medium">Categorie</th>
                <th className="py-2 text-right font-medium">Aantal</th>
                <th className="py-2 text-right font-medium">Volume p/st</th>
                <th className="py-2 text-right font-medium">Totaal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(lead.inventory ?? []).map((item, i) => (
                <tr key={i}>
                  <td className="py-2">{item.name}</td>
                  <td className="py-2 capitalize text-slate-500">{item.category}</td>
                  <td className="py-2 text-right">{item.quantity}×</td>
                  <td className="py-2 text-right">{item.volumeM3.toFixed(2)} m³</td>
                  <td className="py-2 text-right">
                    {(item.volumeM3 * item.quantity).toFixed(2)} m³
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
