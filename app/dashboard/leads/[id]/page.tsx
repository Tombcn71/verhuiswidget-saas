import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompany } from "@/lib/current-company";
import { LEAD_SOURCE_LABEL, getLeadForCompany, normalizeLeadSource } from "@/lib/leads";
import { formatEuroCents, formatDate, formatDateTime } from "@/lib/format";
import { isLeadLocked } from "@/lib/plans";
import { ArrowLeft, Lock, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "../../page-header";
import { setLeadStatus, saveLeadNotes } from "./actions";

export const metadata: Metadata = { title: "Lead" };

const STATUSES = ["nieuw", "gecontacteerd", "akkoord", "gewonnen", "verloren"] as const;

export default async function LeadDetailPage({
  params,
}: PageProps<"/dashboard/leads/[id]">) {
  const { id } = await params;
  const company = await requireCompany();
  const lead = await getLeadForCompany(company.id, id);
  if (!lead) notFound();

  if (isLeadLocked(company, lead)) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardHeader>
          <Lock className="mx-auto size-8 text-muted-foreground" />
          <CardTitle className="mt-2 text-xl">Nieuwe aanvraag</CardTitle>
          <CardDescription>
            Binnengekomen op {formatDateTime(lead.createdAt)}. Je proefperiode is afgelopen;
            activeer een plan om de klantgegevens en offerte te bekijken.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard/abonnement">Bekijk plannen</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

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
    ["Kanaal", LEAD_SOURCE_LABEL[normalizeLeadSource(lead.source)]],
    [isClearance ? "Ontruimadres" : "Van", lead.fromAddress ?? "—"],
    ...(isClearance ? [] : ([["Naar", lead.toAddress ?? "—"]] as Array<[string, string]>)),
    ["Etage", isClearance ? (lead.fromFloor ?? "—") : `${lead.fromFloor ?? "—"} → ${lead.toFloor ?? "—"}`],
    ...(propertyType ? ([["Woningtype", propertyType]] as Array<[string, string]>) : []),
    ...(roomCount ? ([["Aantal kamers", String(roomCount)]] as Array<[string, string]>) : []),
    ["Lift aanwezig", yesNo(hasElevator)],
    ["Bereikbaar voor de wagen", yesNo(streetAccessible)],
    ["Voorkeursdatum", formatDate(lead.moveDate)],
    ...(isClearance ? [] : ([["Afstand", `${Math.round(Number(lead.distanceKm))} km`]] as Array<[string, string]>)),
    ["Totaal volume", `${Number(lead.totalVolumeM3).toFixed(1)} m³`],
    ["Geschat aantal ritten", `${estimatedTrips}× (wagen ${company.truckCapacityM3} m³)`],
    ["Aangevraagd op", formatDateTime(lead.createdAt)],
  ];

  const options = lead.options ?? {};
  const works = cl?.works;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
        <Link href="/dashboard/leads">
          <ArrowLeft /> Terug naar leads
        </Link>
      </Button>
      <PageHeader
        title={lead.customerName}
        description={`${lead.moveType === "ontruiming" ? "Ontruiming" : "Verhuizing"} · aangevraagd op ${formatDateTime(lead.createdAt)}`}
        action={
          <form action={setLeadStatus} className="flex flex-wrap items-center gap-1.5">
            <input type="hidden" name="leadId" value={lead.id} />
            {STATUSES.map((s) => (
              <Button
                key={s}
                name="status"
                value={s}
                size="sm"
                variant={lead.status === s ? "default" : "outline"}
                className="capitalize"
              >
                {s === "akkoord" ? "klant akkoord" : s}
              </Button>
            ))}
          </form>
        }
      />

      {lead.acceptedAt && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
          <PartyPopper className="size-4 shrink-0" />
          <span>
            <strong>{lead.customerName}</strong> ging akkoord met de offerte op{" "}
            {formatDateTime(lead.acceptedAt)}. Bevestig de afspraak en zet de lead op{" "}
            <strong>gewonnen</strong>.
          </span>
        </div>
      )}

      {(lead.followUpSentAt || lead.reviewRequestSentAt) && (
        <p className="mb-4 text-sm text-muted-foreground">
          {lead.followUpSentAt && <>Herinnering verstuurd op {formatDateTime(lead.followUpSentAt)}. </>}
          {lead.reviewRequestSentAt && <>Reviewverzoek verstuurd op {formatDateTime(lead.reviewRequestSentAt)}.</>}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gegevens</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {(options.packing || options.assembly || (options.storageMonths ?? 0) > 0) && (
              <>
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground">Extra opties</p>
                <ul className="mt-1 list-inside list-disc text-sm">
                  {options.packing && <li>Inpakservice</li>}
                  {options.assembly && <li>Meubelmontage en -demontage</li>}
                  {(options.storageMonths ?? 0) > 0 && (
                    <li>Opslag: {options.storageMonths} maand(en)</li>
                  )}
                </ul>
              </>
            )}
            {works && (
              <>
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground">Extra werkzaamheden</p>
                <ul className="mt-1 list-inside list-disc text-sm">
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
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prijsopbouw</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {(lead.priceBreakdown ?? []).map((line, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">{line.label}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatEuroCents(line.amountCents)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="text-muted-foreground">Subtotaal</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEuroCents(lead.subtotalCents)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Btw</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEuroCents(lead.vatCents)}
                  </TableCell>
                </TableRow>
                <TableRow className="text-base font-semibold hover:bg-transparent">
                  <TableCell>Totaal incl. btw</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEuroCents(lead.totalCents)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Notitie</CardTitle>
          <CardDescription>Alleen zichtbaar voor jou en je team.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveLeadNotes} className="space-y-3">
            <input type="hidden" name="leadId" value={lead.id} />
            <Textarea
              name="notes"
              rows={3}
              defaultValue={lead.notes ?? ""}
              placeholder="Bijv. gebeld op 12/3, komt langs voor bezichtiging…"
            />
            <Button type="submit" variant="secondary">
              Notitie opslaan
            </Button>
          </form>
        </CardContent>
      </Card>

      {(lead.photoUrls ?? []).length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Foto&apos;s van de klant</CardTitle>
            <CardDescription>{lead.photoUrls.length} foto&apos;s · klik om te vergroten</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {lead.photoUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Foto ${i + 1}`}
                  className="size-28 rounded-lg border object-cover transition hover:opacity-90"
                />
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Inventarislijst</CardTitle>
          <CardDescription>{lead.inventory?.length ?? 0} regels</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Object</TableHead>
                <TableHead className="hidden sm:table-cell">Categorie</TableHead>
                <TableHead className="text-right">Aantal</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Volume p/st</TableHead>
                <TableHead className="text-right">Totaal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(lead.inventory ?? []).map((item, i) => (
                <TableRow key={i}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="hidden capitalize text-muted-foreground sm:table-cell">
                    {item.category}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{item.quantity}×</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {item.volumeM3.toFixed(2)} m³
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {(item.volumeM3 * item.quantity).toFixed(2)} m³
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
