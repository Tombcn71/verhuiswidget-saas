import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Inbox, Lock, ScanLine, Trophy, Wallet } from "lucide-react";
import { requireCompany } from "@/lib/current-company";
import { normalizeServiceType } from "@/lib/companies";
import { countLeadsThisMonth, getLeadStats, listLeadsForCompany } from "@/lib/leads";
import { isLeadLocked, planFor, scanUsage } from "@/lib/plans";
import { formatEuroCents, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { UsageBar } from "./usage-bar";

export const metadata: Metadata = { title: "Overzicht" };

export default async function DashboardOverviewPage() {
  const company = await requireCompany();
  const [stats, leads, used] = await Promise.all([
    getLeadStats(company.id),
    listLeadsForCompany(company.id, 5),
    countLeadsThisMonth(company.id),
  ]);
  const usage = scanUsage(company, used);
  const serviceType = normalizeServiceType(company.serviceType);

  const kpis = [
    { label: "Leads totaal", value: String(stats.total), icon: Inbox },
    { label: "Laatste 30 dagen", value: String(stats.last30Days), icon: CalendarDays },
    { label: "Openstaande waarde", value: formatEuroCents(stats.pipelineValueCents), icon: Wallet },
    { label: "Gewonnen waarde", value: formatEuroCents(stats.wonValueCents), icon: Trophy },
  ];

  return (
    <>
      <PageHeader
        title="Overzicht"
        description={`Welkom terug bij ${company.name}.`}
        action={
          <Button asChild>
            <Link href="/dashboard/scan">
              <ScanLine /> Nieuwe scan
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="gap-2">
            <CardHeader>
              <CardDescription>{k.label}</CardDescription>
              <CardAction>
                <k.icon className="size-4 text-muted-foreground" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className="gap-3">
          <CardHeader>
            <CardTitle>Offerteaanvragen deze maand</CardTitle>
            <CardDescription>Plan {planFor(company).label}</CardDescription>
          </CardHeader>
          <CardContent>
            <UsageBar usage={usage} />
          </CardContent>
        </Card>

        {serviceType === "beide" ? (
          <Card className="gap-3">
            <CardHeader>
              <CardTitle>Per dienst</CardTitle>
              <CardDescription>Alle aanvragen tot nu toe</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link
                href="/dashboard/leads?type=verhuizing"
                className="rounded-lg border p-3 transition hover:border-primary"
              >
                <p className="text-2xl font-semibold tabular-nums">{stats.verhuizingen}</p>
                <p className="text-sm text-muted-foreground">Verhuizingen</p>
              </Link>
              <Link
                href="/dashboard/leads?type=ontruiming"
                className="rounded-lg border p-3 transition hover:border-primary"
              >
                <p className="text-2xl font-semibold tabular-nums">{stats.ontruimingen}</p>
                <p className="text-sm text-muted-foreground">Ontruimingen</p>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="gap-3">
            <CardHeader>
              <CardTitle>Meer aanvragen krijgen</CardTitle>
              <CardDescription>Zet de widget op je site of deel je link.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/dashboard/embed">
                  Naar widget-link <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recente leads</CardTitle>
          <CardAction>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/leads">
                Alles bekijken <ArrowRight />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nog geen leads. Plaats de{" "}
              <Link href="/dashboard/embed" className="text-primary underline">
                widget-link
              </Link>{" "}
              achter een knop op je website om aanvragen te ontvangen.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klant</TableHead>
                  <TableHead className="hidden sm:table-cell">Datum</TableHead>
                  <TableHead className="hidden md:table-cell">Volume</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  // Afgeschermd na een verlopen proef: de detailpagina toont dan de uitleg.
                  const locked = isLeadLocked(company, lead);
                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/leads/${lead.id}`} className="hover:underline">
                          {locked ? (
                            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                              <Lock className="size-3.5" /> Nieuwe aanvraag
                            </span>
                          ) : (
                            lead.customerName
                          )}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {formatDateTime(lead.createdAt)}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {Number(lead.totalVolumeM3).toFixed(1)} m³
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {locked ? "—" : formatEuroCents(lead.totalCents)}
                      </TableCell>
                      <TableCell className="text-right">
                        <StatusBadge status={lead.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
