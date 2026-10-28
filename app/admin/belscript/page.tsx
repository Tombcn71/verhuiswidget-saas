import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = { title: "Belscript" };

const euro = (cents: number) => `€${cents / 100}`;

const STEPS = [
  {
    title: "Opening",
    say: "Goedemorgen, met Tom van moverAI. Spreek ik met de eigenaar?",
  },
  {
    title: "Waarom je belt (dan stoppen met praten)",
    say: "Ik heb software gebouwd voor verhuisbedrijven. Je klant maakt met zijn telefoon een paar foto's per kamer en krijgt binnen een minuut een offerte met jóuw tarieven. Krijg je aanvragen via offerteplatforms? Dan stuur je de klant meteen je linkje en ben je als eerste met een echte prijs.",
  },
  {
    title: "De vraag",
    say: "Ik weet dat je druk bent, dus ik houd het kort. Mag ik je een linkje naar de demo mailen? Dan probeer je het zelf wanneer het jou uitkomt.",
  },
  {
    title: "Bij ja",
    say: "Top! Op welk e-mailadres? (herhaal het adres) Ik stuur het je nu. In de mail kun je ook een kort gesprek inplannen, ook 's avonds. Fijne dag!",
  },
];

const OBJECTIONS = [
  ["Geen tijd.", "Daarom mail ik het. Het kost je twee minuten wanneer het jou uitkomt."],
  [
    "Wat kost het?",
    `${euro(PLANS.basic.priceCents)} per maand, of ${euro(PLANS.pro.priceCents)} met ${PLANS.pro.seats} gebruikers en ${PLANS.pro.scans} scans. Je probeert het eerst 14 dagen gratis, zonder betaalgegevens.`,
  ],
  [
    "We zitten al bij een offerteplatform.",
    "Juist dan. Je stuurt elke aanvraag meteen je linkje en hebt als eerste een echte prijs, in plaats van een schatting of een afspraak om langs te komen.",
  ],
  [
    "Werkt dat wel, zo'n AI?",
    "Daarom stuur ik je de demo. Kies een voorbeeldwoning en kijk zelf of het volume en de prijs kloppen.",
  ],
  [
    "Klopt de prijs dan wel?",
    "Het rekent met jouw eigen tarieven. Je uploadt een oude factuur, dan staan ze klaar, en je test ze met voorbeeldwoningen voordat een klant het ziet.",
  ],
  [
    "Mijn klanten kunnen dat niet.",
    "Het is een paar foto's per kamer, net als foto's sturen in WhatsApp. Lukt het iemand niet, dan doe je het gewoon zoals nu.",
  ],
  [
    "We hebben al software.",
    "moverAI kan ernaast, alleen voor het scannen en de offerte. Kijk gerust in de demo.",
  ],
  ["Geen interesse.", "Helemaal goed, bedankt voor je tijd! (niet doordrukken, ophangen)"],
];

const AFTER = [
  "Zet het bedrijf in het CRM (of zoek het op), vul het e-mailadres in en klik op Demo mailen. Dat stuurt de demolink meteen.",
  "Opent hij de demo niet binnen 3 dagen, dan gaat er vanzelf één herinnering: “Even de demo bekijken?”.",
  "Heeft hij de demo gedaan, dan gaat de ochtend erna vanzelf “Wat vond je van de demo?” met de knop Plan een vrijblijvend adviesgesprek. Niet als hij al op die knop heeft geklikt.",
  "Zie je in het CRM dat de demo gedaan is? App hem zelf dezelfde dag: “Hoi [naam], ik zag dat je de demo hebt gedaan. Wat vond je ervan?” Pas bij een positieve reactie stuur je je Calendly-link.",
  "Staat er een afspraak in Calendly: zet de fase op Gesprek gepland. Dan stoppen de automatische mails.",
  "In het gesprek: samen het account aanmaken, een oude factuur uploaden, de prijs testen met een voorbeeldwoning, en zijn korte linkje met het kant-en-klare bericht laten zien. Daarna fase op Proef gestart.",
];

/** Belscript voor het werven van verhuisbedrijven; gelijk met de CRM-mails en de prijzen. */
export default function CallScriptPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Belscript</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Doel van elk gesprek is één ja: mag ik je een demolinkje mailen? Je verkoopt niets aan de
          telefoon, de demo doet het werk.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Voor je belt</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            <li>Doel deze week: 10 proefaccounts, ongeveer 15 tot 20 gesprekken per dag.</li>
            <li>Beste tijden: 8:00 tot 10:00 en 16:00 tot 18:00. Daartussen zijn verhuizers vaak op pad.</li>
            <li>Bij de hand: dit CRM open, zodat je na een ja meteen het e-mailadres invult en op Demo mailen klikt.</li>
            <li>Toon: rustig en kort. Jij bent iemand uit de branche die iets handigs heeft gebouwd, geen verkoper.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Het gesprek (hooguit 1 minuut)</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">&ldquo;{s.say}&rdquo;</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bezwaren</CardTitle>
          <p className="text-sm text-muted-foreground">
            Kom bij elk bezwaar terug op hetzelfde kleine verzoek: het linkje mailen. Dat kost hem
            niets en hij hoeft niets te beslissen.
          </p>
        </CardHeader>
        <CardContent>
          <div className="divide-y rounded-lg border text-sm">
            {OBJECTIONS.map(([he, you]) => (
              <div key={he} className="grid gap-1 p-3 sm:grid-cols-[14rem_1fr] sm:gap-4">
                <p className="font-medium">&ldquo;{he}&rdquo;</p>
                <p className="text-muted-foreground">{you}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Niet de eigenaar of voicemail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold">Receptie of een medewerker</p>
            <p className="text-muted-foreground">
              &ldquo;Ik bel voor de eigenaar of degene die de offertes doet. Hoe heet diegene, en
              wanneer kan ik hem het best bereiken?&rdquo; Zet naam en tijd bij het bedrijf in het CRM.
            </p>
          </div>
          <div>
            <p className="font-semibold">Voicemail (maximaal 20 seconden)</p>
            <p className="text-muted-foreground">
              &ldquo;Hoi, met Tom van moverAI. Ik heb software waarmee je klanten binnen een minuut
              een offerte met jouw tarieven krijgen, ook bij aanvragen van offerteplatforms. Ik bel
              je morgen nog even.&rdquo; Bel de volgende dag op een ander tijdstip terug. Na twee
              keer voicemail: een kort LinkedIn-bericht, en door naar de volgende.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Na het gesprek</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {AFTER.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            Bijhouden: zet na elk gesprek de fase en een notitie bij het bedrijf, ook als je niemand
            bereikt. Zo zie je vrijdag in het CRM welke tijden en welke aanpak het meeste opleverden.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
