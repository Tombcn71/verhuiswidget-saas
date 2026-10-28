import { PLANS } from "@/lib/plans";

/** Sleutel in admin_state voor Toms eigen versie. */
export const SCRIPT_KEY = "belscript";

const euro = (cents: number) => `€${cents / 100}`;

const STEPS = [
  {
    title: "Opening",
    say: "Goedemorgen, met Tom van moverAI. Spreek ik met de eigenaar?",
  },
  {
    title: "De vraag die het gesprek opent",
    say: "Krijg je aanvragen via offerteplatforms? (laat hem praten: welke, hoeveel, wat het kost)",
  },
  {
    title: "Waarom je belt (dan stoppen met praten)",
    say: "Ik heb iets gebouwd waarmee je daar als eerste bent. Aanvraag binnen? Je tikt het e-mailadres in, één klik, en de klant scant zijn kamers met zijn telefoon. Binnen een minuut heeft hij jouw prijs, met jóuw tarieven. Zonder bezoek aan huis.",
  },
  {
    title: "Het kleine verzoek",
    say: "Ik houd het kort. Mag ik je de demo mailen? Dan zie je zelf in een minuut of de prijs klopt.",
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
    `Eerst een vraag terug: wat betaal je per maand aan offerteplatforms, en hoeveel ritjes rijd je om te kijken? moverAI kost ${euro(PLANS.basic.priceCents)} per maand, of ${euro(PLANS.pro.priceCents)} met ${PLANS.pro.seats} gebruikers en ${PLANS.pro.scans} scans. Je probeert het eerst 14 dagen gratis, zonder betaalgegevens.`,
  ],
  [
    "Dat is duur.",
    "Eén bezoek aan huis kost je al anderhalf uur plus de rit. Win je er één extra opdracht per maand mee, dan heb je het ruim terugverdiend. Probeer het 14 dagen gratis, dan zie je het zelf.",
  ],
  [
    "We zitten al bij een offerteplatform.",
    "Juist dan. Je betaalt al voor die aanvraag. Met moverAI heeft die klant binnen een minuut jouw prijs, terwijl de anderen nog moeten terugbellen of langskomen.",
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
  "Zet het bedrijf in het CRM (of zoek het op), vul het e-mailadres in en klik op Demo mailen. Dat stuurt de demolink meteen. Schrijf in de notitie via welke offerteplatforms hij werkt.",
  "Opent hij de demo niet binnen 3 dagen, dan gaat er vanzelf één herinnering: “Even de demo bekijken?”.",
  "Heeft hij de demo gedaan, dan gaat de ochtend erna vanzelf “Wat vond je van de demo?” met de knop Plan een vrijblijvend adviesgesprek. Niet als hij al op die knop heeft geklikt. Doet iemand de demo via de website, dan komt hij vanzelf in het CRM met dezelfde opvolging.",
  "Zie je in het CRM dat de demo gedaan is? App hem zelf dezelfde dag: “Hoi [naam], ik zag dat je de demo hebt gedaan. Wat vond je ervan?” Pas bij een positieve reactie stuur je je Calendly-link.",
  "Staat er een afspraak in Calendly: zet de fase op Gesprek gepland. Dan stoppen de automatische mails.",
  "In het gesprek: samen het account aanmaken, een oude factuur uploaden en de prijs testen met een voorbeeldwoning. Laat dan Snelle acties zien: vraag zijn e-mailadres, klik op Mail, en zijn telefoon trilt. Daarna fase op Proef gestart.",
  "Geef hem een opdracht mee voor de proef: “Stuur de komende 14 dagen elke aanvraag van een offerteplatform je linkje. Dan zie je zelf wat het oplevert.” Bel hem na een week: “Heb je al aanvragen doorgestuurd?”",
];

/**
 * Het standaard belscript als platte tekst (zolang Tom het niet zelf heeft aangepast).
 * Opmaak: "# " = kop, "- " = opsomming, "1. Titel: tekst" = stap, "vraag | antwoord" = bezwaar.
 */
export const DEFAULT_SCRIPT = [
  "Doel van elk gesprek is één ja: mag ik je een demolinkje mailen? Je verkoopt niets aan de telefoon, de demo doet het werk.",
  "",
  "# Voor je belt",
  "- Doel: 50 belletjes per dag. Deze week 10 proefaccounts.",
  "- Beste tijden: 8:00 tot 10:00 en 16:00 tot 18:00. Daartussen zijn verhuizers vaak op pad.",
  "- Bij de hand: dit CRM open, zodat je na een ja meteen het e-mailadres invult en op Demo mailen klikt.",
  "- Toon: rustig en kort. Jij bent iemand uit de branche die iets handigs heeft gebouwd, geen verkoper.",
  "",
  "# Het gesprek (hooguit 2 minuten)",
  ...STEPS.map((s, i) => `${i + 1}. ${s.title}: “${s.say}”`),
  "",
  "# Bezwaren",
  "Kom bij elk bezwaar terug op hetzelfde kleine verzoek: het linkje mailen. Dat kost hem niets en hij hoeft niets te beslissen.",
  ...OBJECTIONS.map(([he, you]) => `“${he}” | ${you}`),
  "",
  "# Niet de eigenaar of voicemail",
  "- Receptie of een medewerker: “Ik bel voor de eigenaar of degene die de offertes doet. Hoe heet diegene, en wanneer kan ik hem het best bereiken?” Zet naam en tijd bij het bedrijf in het CRM.",
  "- Voicemail (maximaal 20 seconden): “Hoi, met Tom van moverAI. Ik heb software waarmee je klanten binnen een minuut een offerte met jouw tarieven krijgen, ook bij aanvragen van offerteplatforms. Ik bel je morgen nog even.” Bel de volgende dag op een ander tijdstip terug. Na twee keer voicemail: een kort LinkedIn-bericht, en door naar de volgende.",
  "",
  "# Na het gesprek",
  ...AFTER.map((t, i) => `${i + 1}. ${t}`),
  "Bijhouden: zet na elk gesprek de fase en een notitie bij het bedrijf, ook als je niemand bereikt. Zo zie je vrijdag in het CRM welke tijden en welke aanpak het meeste opleverden.",
].join("\n");
