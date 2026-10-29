import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  STAGES,
  demoLinkFor,
  getProspect,
} from "@/lib/prospects";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyBlock } from "@/app/dashboard/embed/copy-block";
import { deleteAction, updateAction } from "../../actions";
import { StageBadge } from "../../stage-badge";
import { ContactButtons } from "../../contact-buttons";

const WHATSAPP_OPENING = `Hoi! Ik ben Tom van moverAI. Ik heb AI-software gebouwd voor verhuisbedrijven: je klant maakt een paar foto's per kamer en krijgt binnen een minuut een offerte met jouw tarieven, zonder huisbezoek.
Vooral handig bij aanvragen via offerteplatforms, want dan ben je als eerste met een offerte.
Mag ik je een linkje naar de demo sturen? Duurt een minuut. 🚚`;

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} />
    </div>
  );
}

export default async function ProspectPage({ params }: PageProps<"/admin/prospects/[id]">) {
  const { id } = await params;
  const p = await getProspect(id);
  if (!p) notFound();

  const timeline = [
    { label: "Toegevoegd", at: p.createdAt },
    { label: "📤 Demo gestuurd", at: p.demoSentAt },
    { label: "👀 Demolink geopend", at: p.demoOpenedAt },
    { label: "✅ Demo afgerond", at: p.demoCompletedAt },
    { label: "🔥 Klikte op boeken", at: p.demoBookedAt },
    { label: "📅 Klikte op adviesgesprek", at: p.meetingClickedAt },
  ]
    .filter((t): t is { label: string; at: Date } => !!t.at)
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  const now = new Date();
  const mails = [
    p.reminderAt && {
      label: p.reminderAt > now ? "Herinnering ingepland" : "Herinnering verstuurd",
      at: p.reminderAt,
    },
    p.followUpAt && {
      label: p.followUpAt > now ? "\u201cWat vond je ervan?\u201d ingepland" : "\u201cWat vond je ervan?\u201d verstuurd",
      at: p.followUpAt,
    },
  ].filter((m): m is { label: string; at: Date } => !!m);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
        <Link href="/admin">
          <ArrowLeft /> Terug naar CRM
        </Link>
      </Button>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{p.companyName}</h1>
          <StageBadge stage={p.stage} />
        </div>
        <ContactButtons
          id={p.id}
          phone={p.phone ?? p.mobile}
          email={p.email}
          sent={!!p.demoSentAt}
          size="default"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <form action={updateAction} className="space-y-4 lg:col-span-2">
          <input type="hidden" name="id" value={p.id} />
          <Card>
            <CardHeader>
              <CardTitle>Fase en opvolging</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="stage">Fase</Label>
                <select
                  id="stage"
                  name="stage"
                  defaultValue={p.stage}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Reden afgevallen" name="lostReason" defaultValue={p.lostReason} />
              <Field label="Volgende actie" name="nextAction" defaultValue={p.nextAction} />
              <Field label="Op datum" name="nextActionOn" type="date" defaultValue={p.nextActionOn} />
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" name="autoMailOff" defaultChecked={p.autoMailOff} className="size-4" />
                Niet meer automatisch mailen (geplande opvolgmails worden geannuleerd)
              </label>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="notes">Notities</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={5}
                  defaultValue={p.notes ?? ""}
                  placeholder="Bijv. 24/10 gebeld met Peter, interesse, werkt met 3 wagens…"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gegevens</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Bedrijfsnaam" name="companyName" defaultValue={p.companyName} />
              <Field label="Contactpersoon" name="contactName" defaultValue={p.contactName} />
              <Field label="Telefoon" name="phone" defaultValue={p.phone} />
              <Field label="Mobiel" name="mobile" defaultValue={p.mobile} />
              <Field label="E-mail" name="email" type="email" defaultValue={p.email} />
              <Field label="Website" name="website" defaultValue={p.website} />
              <Field label="Plaats" name="city" defaultValue={p.city} />
              {(p.address || p.placeId) && (
                <p className="text-sm text-muted-foreground sm:col-span-2">
                  {p.address}
                  {p.rating != null &&
                    ` · ${p.rating.toLocaleString("nl-NL")}★${p.reviewCount ? ` (${p.reviewCount} reviews)` : ""}`}
                  {p.placeId && (
                    <>
                      {" · "}
                      <a
                        href={`https://www.google.com/maps/place/?q=place_id:${p.placeId}`}
                        target="_blank"
                        rel="noopener"
                        className="text-primary underline"
                      >
                        Bekijk op Google Maps
                      </a>
                    </>
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          <Button type="submit">Opslaan</Button>
        </form>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp</CardTitle>
              <CardDescription>Kopieer en plak in het WhatsApp-gesprek.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium">Openingsbericht</p>
              <CopyBlock multiline code={WHATSAPP_OPENING} />
              <p className="text-sm font-medium">Zegt hij ja</p>
              <CopyBlock multiline code={`Top! Hier is hij: ${demoLinkFor(p)}\nVragen? App me gewoon.\n\nGroet, Tom`} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eigen demolink</CardTitle>
              <CardDescription>
                Alleen via deze link ziet de CRM wat {p.companyName} met de demo doet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <CopyBlock code={demoLinkFor(p)} />
              <Button asChild variant="ghost" size="sm">
                <a href={demoLinkFor(p)} target="_blank" rel="noopener">
                  <ExternalLink /> Bekijk zoals zij het zien
                </a>
              </Button>
              <p className="text-xs text-muted-foreground">
                Zelf openen telt niet mee als &ldquo;geopend&rdquo; zolang je ingelogd bent als
                beheerder.
              </p>
            </CardContent>
          </Card>

          {mails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Automatische mails</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {mails.map((m) => (
                    <li key={m.label} className="flex justify-between gap-3">
                      <span>{m.label}</span>
                      <span className="text-muted-foreground">{formatDateTime(m.at)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Tijdlijn</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                {timeline.map((t) => (
                  <li key={t.label} className="flex justify-between gap-3">
                    <span>{t.label}</span>
                    <span className="text-muted-foreground">{formatDateTime(t.at)}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <form action={deleteAction}>
            <input type="hidden" name="id" value={p.id} />
            <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
              Verwijderen
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
