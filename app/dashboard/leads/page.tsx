import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Lock } from "lucide-react";
import { requireCompany } from "@/lib/current-company";
import { normalizeServiceType } from "@/lib/companies";
import { LEAD_SOURCE_LABEL, listLeadsForCompany, normalizeLeadSource } from "@/lib/leads";
import { formatEuroCents, formatDateTime } from "@/lib/format";
import { isLeadLocked } from "@/lib/plans";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "../page-header";
import { StatusBadge } from "../status-badge";

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
    <>
      <PageHeader
        title="Leads"
        description="Alle offerteaanvragen, nieuwste bovenaan."
        action={
          showFilter && (
            // Filter via de URL (?type=), zodat een gefilterde lijst te delen/terug te vinden is.
            <Tabs value={active ?? ""}>
              <TabsList>
                {FILTERS.map((f) => (
                  <TabsTrigger key={f.key} value={f.key} asChild>
                    <Link href={f.key ? `/dashboard/leads?type=${f.key}` : "/dashboard/leads"}>
                      {f.label}
                    </Link>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )
        }
      />

      <Card className="py-0">
        <CardContent className="px-0">
          {leads.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
              <Inbox className="size-8" />
              {active ? "Geen aanvragen in deze categorie." : "Nog geen aanvragen ontvangen."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Klant</TableHead>
                  <TableHead className="hidden md:table-cell">Datum</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Volume</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                  <TableHead className="pr-6 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) =>
                  isLeadLocked(company, lead) ? (
                    <TableRow key={lead.id} className="bg-muted/40">
                      <TableCell className="pl-6">
                        <Link
                          href="/dashboard/abonnement"
                          className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:underline"
                        >
                          <Lock className="size-3.5" /> Nieuwe aanvraag
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          Activeer een plan om te bekijken
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {formatDateTime(lead.createdAt)}
                      </TableCell>
                      <TableCell className="hidden capitalize text-muted-foreground sm:table-cell">
                        {lead.moveType}
                      </TableCell>
                      <TableCell className="hidden text-right text-muted-foreground lg:table-cell">
                        —
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">—</TableCell>
                      <TableCell className="pr-6" />
                    </TableRow>
                  ) : (
                    <TableRow key={lead.id}>
                      <TableCell className="pl-6">
                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {lead.customerName}
                        </Link>
                        <div className="text-xs text-muted-foreground">{lead.customerEmail}</div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {formatDateTime(lead.createdAt)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="capitalize">{lead.moveType}</span>
                        <div className="text-xs text-muted-foreground">
                          {LEAD_SOURCE_LABEL[normalizeLeadSource(lead.source)]}
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums text-muted-foreground lg:table-cell">
                        {Number(lead.totalVolumeM3).toFixed(1)} m³
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {lead.totalCents > 0 ? formatEuroCents(lead.totalCents) : "Geen prijs"}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <StatusBadge status={lead.status} />
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
