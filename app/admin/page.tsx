import Link from "next/link";
import { MessageCircle, Plus, Upload } from "lucide-react";
import {
  STAGES,
  isStage,
  listProspects,
  nextPlacesCity,
} from "@/lib/prospects";
import type { Prospect } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { createAction } from "./actions";
import { ImportForm } from "./import-form";
import { FetchForm } from "./fetch-form";
import { CheckSitesButton } from "./check-sites-button";
import { ContactButtons } from "./contact-buttons";
import { StageBadge } from "./stage-badge";

/** Wat het bedrijf met de demolink deed (automatisch bijgehouden). */
function DemoSignals({ p }: { p: Prospect }) {
  const items = [
    p.meetingClickedAt && { icon: "📅", label: "Klikte op adviesgesprek", at: p.meetingClickedAt },
    p.demoBookedAt && { icon: "🔥", label: "Wil boeken", at: p.demoBookedAt },
    p.demoCompletedAt && { icon: "✅", label: "Demo gedaan", at: p.demoCompletedAt },
    p.demoOpenedAt && { icon: "👀", label: "Geopend", at: p.demoOpenedAt },
    p.demoSentAt && { icon: "📤", label: "Gestuurd", at: p.demoSentAt },
  ].filter(Boolean) as { icon: string; label: string; at: Date }[];
  if (items.length === 0) return <span className="text-muted-foreground">—</span>;
  const latest = items[0];
  return (
    <span title={items.map((i) => `${i.label}: ${formatDateTime(i.at)}`).join("\n")}>
      {latest.icon} {latest.label}
      <span className="block text-xs text-muted-foreground">{formatDateTime(latest.at)}</span>
    </span>
  );
}

// "Check websites op WhatsApp" bekijkt tientallen sites per klik.
export const maxDuration = 300;

const today = () => new Date().toLocaleDateString("sv-SE");

export default async function CrmPage({ searchParams }: PageProps<"/admin">) {
  const { fase, q, pagina, wa } = await searchParams;
  // Standaard alleen bedrijven met WhatsApp (Tom benadert via WhatsApp); ?wa=0 toont alles.
  const onlyWa = wa !== "0";
  const [all, nextCity] = await Promise.all([listProspects(), nextPlacesCity()]);
  const active = isStage(fase) ? fase : null;
  // Zoeken (naam, contact, plaats, telefoon, e-mail) en 100 per pagina: werkbaar met grote lijsten.
  const query = typeof q === "string" ? q.trim().toLowerCase() : "";
  // Zonder WhatsApp alleen verbergen als er nog niks mee gebeurd is: een demo via de
  // website (bijv. na Facebook) of een bedrijf verder in de fases blijft zichtbaar.
  const inWaView = (p: Prospect) =>
    !!p.whatsapp || p.stage !== "nieuw" || !!p.demoSentAt || !!p.demoOpenedAt || !!p.demoCompletedAt;
  const scope = onlyWa ? all.filter(inWaView) : all;
  const filtered = (active ? scope.filter((p) => p.stage === active) : scope.filter((p) => p.stage !== "afgevallen"))
    .filter(
      (p) =>
        !query ||
        [p.companyName, p.contactName, p.city, p.phone, p.email]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(query)),
    );
  const PAGE_SIZE = 100;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(pagina) || 1));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    if (active) params.set("fase", active);
    if (query) params.set("q", query);
    if (!onlyWa) params.set("wa", "0");
    if (n > 1) params.set("pagina", String(n));
    const qs = params.toString();
    return qs ? `/admin?${qs}` : "/admin";
  };

  // Opvolgen: demo gedaan/geopend maar nog geen proef, of de volgende actie is vandaag of eerder.
  const followUp = all.filter(
    (p) =>
      !["proef", "klant", "afgevallen"].includes(p.stage) &&
      (p.meetingClickedAt ||
        p.demoBookedAt ||
        p.demoCompletedAt ||
        p.demoOpenedAt ||
        (p.nextActionOn && p.nextActionOn <= today())),
  );

  const count = (key: string) => scope.filter((p) => p.stage === key).length;
  const withDemo = all.filter((p) => p.demoSentAt).length;
  const demoDone = all.filter((p) => p.demoCompletedAt).length;
  const customers = all.filter((p) => p.stage === "klant").length;
  const withWa = all.filter((p) => inWaView(p) && p.stage !== "afgevallen").length;
  const sitesToCheck = all.filter((p) => p.website && !p.siteCheckedAt && p.stage !== "afgevallen").length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Verkoop-CRM</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verhuisbedrijven die je klant wilt maken. Openen, afronden en &ldquo;boeken&rdquo; in
            de demo worden automatisch bijgehouden.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {withDemo} demo&apos;s gestuurd · {demoDone} gedaan · {customers}{" "}
          {customers === 1 ? "klant" : "klanten"}
        </p>
      </div>

      {followUp.length > 0 && (
        <Card className="mb-4 border-amber-200 bg-amber-50/60">
          <CardHeader>
            <CardTitle>Opvolgen ({followUp.length})</CardTitle>
            <CardDescription>
              Demo bekeken of gedaan, of je volgende actie staat voor vandaag.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {followUp.slice(0, 9).map((p) => (
              <Link
                key={p.id}
                href={`/admin/prospects/${p.id}`}
                className="rounded-lg border bg-background p-3 text-sm transition hover:border-primary"
              >
                <span className="font-medium">{p.companyName}</span>
                <span className="mt-1 block text-muted-foreground">
                  <DemoSignals p={p} />
                </span>
                {p.nextAction && (
                  <span className="mt-1 block text-xs">
                    ➜ {p.nextAction}
                    {p.nextActionOn && ` · ${formatDate(p.nextActionOn)}`}
                  </span>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Nieuwe verhuisbedrijven ophalen</CardTitle>
          <CardDescription>Via Google: naam, telefoon, website en beoordeling.</CardDescription>
        </CardHeader>
        <CardContent>
          <FetchForm nextCity={nextCity} />
          <CheckSitesButton remaining={sitesToCheck} />
        </CardContent>
      </Card>

      <form action="/admin" className="mb-3 flex max-w-md gap-2">
        {active && <input type="hidden" name="fase" value={active} />}
        {!onlyWa && <input type="hidden" name="wa" value="0" />}
        <Input
          name="q"
          defaultValue={query}
          placeholder="Zoek op naam, plaats, telefoon…"
          aria-label="Zoeken"
        />
        <Button type="submit" variant="outline">
          Zoeken
        </Button>
      </form>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Button asChild size="sm" variant={active ? "outline" : "default"}>
          <Link href={onlyWa ? "/admin" : "/admin?wa=0"}>Actief ({scope.length - count("afgevallen")})</Link>
        </Button>
        {STAGES.map((s) => (
          <Button key={s.key} asChild size="sm" variant={active === s.key ? "default" : "outline"}>
            <Link href={`/admin?fase=${s.key}${onlyWa ? "" : "&wa=0"}`}>
              {s.label} ({count(s.key)})
            </Link>
          </Button>
        ))}
        <Button
          asChild
          size="sm"
          variant={onlyWa ? "default" : "outline"}
          className={onlyWa ? "" : "border-emerald-300 text-emerald-700"}
        >
          <Link
            href={(() => {
              const params = new URLSearchParams();
              if (active) params.set("fase", active);
              if (query) params.set("q", query);
              if (onlyWa) params.set("wa", "0");
              const qs = params.toString();
              return qs ? `/admin?${qs}` : "/admin";
            })()}
          >
            <MessageCircle /> {onlyWa ? `Alleen WhatsApp (${withWa})` : "Toon alleen WhatsApp"}
          </Link>
        </Button>
      </div>

      <Card className="py-0">
        <CardContent className="px-0">
          {filtered.length > 0 && (
            <p className="border-b px-6 py-2 text-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "bedrijf" : "bedrijven"}
              {query && ` voor "${query}"`}
              {pages > 1 && ` · pagina ${page} van ${pages}`}
            </p>
          )}
          {shown.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {all.length === 0
                ? "Nog geen bedrijven. Plak hieronder je lijst of voeg er één toe."
                : "Geen bedrijven in deze fase."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Bedrijf</TableHead>
                  <TableHead>Fase</TableHead>
                  <TableHead className="hidden md:table-cell">Demo</TableHead>
                  <TableHead className="hidden lg:table-cell">Volgende actie</TableHead>
                  <TableHead className="pr-6 text-right">Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-6">
                      <Link
                        href={`/admin/prospects/${p.id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {p.companyName}
                      </Link>
                      {p.whatsapp && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 align-middle text-xs font-medium text-emerald-700">
                          <MessageCircle className="size-3" /> WhatsApp
                        </span>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {[
                          p.contactName,
                          p.city,
                          p.rating != null &&
                            `${p.rating.toLocaleString("nl-NL")}★${p.reviewCount ? ` (${p.reviewCount})` : ""}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StageBadge stage={p.stage} />
                    </TableCell>
                    <TableCell className="hidden text-sm md:table-cell">
                      <DemoSignals p={p} />
                    </TableCell>
                    <TableCell className="hidden text-sm lg:table-cell">
                      {p.nextAction || p.nextActionOn ? (
                        <>
                          {p.nextAction ?? "—"}
                          {p.nextActionOn && (
                            <span
                              className={cn(
                                "block text-xs",
                                p.nextActionOn <= today() ? "font-medium text-amber-700" : "text-muted-foreground",
                              )}
                            >
                              {formatDate(p.nextActionOn)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <ContactButtons
                        id={p.id}
                        phone={p.phone ?? p.mobile}
                        email={p.email}
                        sent={!!p.demoSentAt}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {pages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-3">
              <Button asChild size="sm" variant="outline" className={page <= 1 ? "pointer-events-none opacity-40" : ""}>
                <Link href={pageHref(page - 1)}>← Vorige</Link>
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {page} van {pages}
              </span>
              <Button asChild size="sm" variant="outline" className={page >= pages ? "pointer-events-none opacity-40" : ""}>
                <Link href={pageHref(page + 1)}>Volgende →</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-4" /> Lijst plakken
            </CardTitle>
            <CardDescription>Meerdere bedrijven tegelijk, uit Excel of Google Sheets.</CardDescription>
          </CardHeader>
          <CardContent>
            <ImportForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-4" /> Eén bedrijf toevoegen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createAction} className="grid gap-3 sm:grid-cols-2">
              <Input name="companyName" placeholder="Bedrijfsnaam *" required className="sm:col-span-2" />
              <Input name="contactName" placeholder="Contactpersoon" />
              <Input name="phone" placeholder="Telefoon" inputMode="tel" />
              <Input name="email" type="email" placeholder="E-mail" />
              <Input name="city" placeholder="Plaats" />
              <Button type="submit" className="sm:col-span-2">
                Toevoegen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
