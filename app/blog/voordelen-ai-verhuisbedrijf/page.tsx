import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/app/_components/site-header";
import { SiteFooter } from "@/app/_components/site-footer";
import { WhatsAppButton } from "@/app/_components/whatsapp-button";
import { Author, BlogCta, H2, H3, LINK, P, Table } from "@/app/blog/_components/blog-parts";

const TITLE = "Wat zijn de voordelen van AI voor een verhuisbedrijf? 6 voordelen op een rij";
const DESCRIPTION =
  "Sneller offertes op offerteplatforms, minder voorinspecties, minder brandstof en meer Google-reviews. Dit zijn de 6 voordelen van AI voor je verhuisbedrijf.";

export const metadata: Metadata = {
  title: "Voordelen van AI voor een verhuisbedrijf: 6 op een rij",
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article" },
};

const FAQS = [
  {
    q: "Hoeveel bespaart een verhuisbedrijf met AI?",
    a: "Per voorinspectie die je niet meer hoeft te doen, bespaar je ongeveer €70 aan personeelsuren en brandstof. Bij 20 voorinspecties per maand is dat €1.400 per maand. Daarbovenop komt de tijd die je bespaart op het maken van offertes.",
  },
  {
    q: "Hoe snel krijgt een klant een offerte met AI?",
    a: "Binnen een minuut nadat de klant zijn foto's heeft gemaakt. De offerte heeft jouw naam en jouw tarieven.",
  },
  {
    q: "Hoe weet de AI hoeveel m³ een verhuizing is?",
    a: "De klant maakt een paar foto's per kamer. De AI herkent de meubels en dozen op die foto's, telt de inboedel en berekent het aantal m³. Jij krijgt de foto's en een inventarislijst erbij.",
  },
  {
    q: "Kan ik ook offertes geven als ik niet op kantoor ben?",
    a: "Ja. Met Onsite staat er een offerteknop op je eigen website. Bezoekers krijgen dan ook 's avonds en in het weekend binnen een minuut een offerte.",
  },
  {
    q: "Hoe krijg ik meer Google-reviews als verhuisbedrijf?",
    a: "Vraag elke klant na de verhuizing om een review. moverAI doet dat automatisch, zodat je het niet zelf hoeft bij te houden.",
  },
  {
    q: "Werkt AI ook als ik zelf bij de klant sta?",
    a: "Ja, daar is Onspot voor. Je opent moverAI in de browser op je telefoon, fotografeert elke ruimte en hebt de offerte ter plekke klaar.",
  },
];

const JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    datePublished: "2026-11-05",
    author: { "@type": "Person", name: "Tom van Reijn", jobTitle: "Oprichter moverAI" },
    publisher: { "@type": "Organization", name: "moverAI" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export default function BlogPost() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 sm:py-16">
        <article className="mx-auto w-full max-w-3xl px-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{TITLE}</h1>
          <Author />

          <p className="mt-10 rounded-xl bg-muted px-5 py-4 text-lg leading-relaxed">
            <strong>Kort antwoord:</strong> AI levert een verhuisbedrijf zes voordelen op: je bent sneller bij
            aanvragen op offerteplatforms, je bespaart personeelsuren en brandstof omdat voorinspecties niet
            meer nodig zijn, je krijgt meer Google-reviews, je rijdt minder halflege ritten omdat je vooraf het
            aantal m³ weet, en je hoeft geen offertes meer met de hand te maken. De klant maakt een paar
            foto&apos;s, en binnen een minuut heeft hij een offerte met jouw naam en tarieven.
          </p>

          <H2>Waar verliest een verhuisbedrijf tijd en geld vóór de verhuizing?</H2>
          <P>
            Het meeste geld lekt weg in het offerteproces, nog voordat er een doos verhuisd is. Een gangbare
            aanvraag gaat zo:
          </P>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-lg leading-relaxed">
            <li>Er komt een aanvraag binnen via een offerteplatform, de telefoon of WhatsApp.</li>
            <li>Je plant een afspraak voor een voorinspectie.</li>
            <li>Een medewerker rijdt naar de klant en telt de inboedel.</li>
            <li>Op kantoor rekent iemand de m³ uit en vult de offerte in.</li>
            <li>De offerte gaat naar de klant, soms pas een paar dagen na de aanvraag.</li>
          </ol>
          <P>
            Elke stap kost tijd, en een voorinspectie kost al snel ongeveer €70 aan uren en brandstof. Die
            kosten maak je ook voor klanten die nooit boeken. En op een offerteplatform heeft een snellere
            verhuizer de klus dan misschien al binnen.
          </P>
          <P>
            AI haalt de meeste van die stappen weg. De klant maakt zelf een paar foto&apos;s per kamer, de AI
            telt de inboedel en de m³, en de offerte staat binnen een minuut klaar.
          </P>

          <H2>1. Sneller bij aanvragen op offerteplatforms</H2>
          <P>
            Met AI stuur je een klant binnen een minuut een offerte, waar dat zonder AI pas na een voorinspectie
            kan. Op een offerteplatform gaat dezelfde aanvraag meestal naar meerdere verhuizers tegelijk. Wie als
            eerste een duidelijke offerte stuurt, maakt de meeste kans op de klus.
          </P>
          <P>
            Met <Link href="/onlink" className={LINK}>Onlink</Link> tik je het e-mailadres van de klant in of
            stuur je een linkje via WhatsApp. Het bericht staat al klaar. De klant maakt foto&apos;s van zijn
            kamers met zijn telefoon en heeft binnen een minuut jouw offerte. Andere verhuizers zijn dan vaak nog
            bezig een afspraak voor een voorinspectie in te plannen.
          </P>

          <H2>2. Minder personeelsuren</H2>
          <P>
            AI bespaart een verhuisbedrijf ongeveer anderhalf uur personeelstijd per aanvraag, omdat een
            voorinspectie niet meer nodig is. Bij een uurloon van €45 is dat €67,50 per voorinspectie.
          </P>
          <P>
            In die tijd kan een medewerker ook gewoon verhuizen of op kantoor werken. Met moverAI maakt de klant
            zelf de foto&apos;s, en je mensen blijven aan het werk: op de wagen of op kantoor.
          </P>

          <H2>3. Minder brandstofkosten</H2>
          <P>
            AI scheelt je de kilometers die je nu rijdt om alleen een inboedel te bekijken. Dat zijn kosten die je
            ook maakt voor klanten die uiteindelijk nooit boeken.
          </P>
          <P>
            Tel je de brandstof op bij de personeelsuren, dan kost één voorinspectie al snel ongeveer €70. Bij 20
            voorinspecties per maand is dat €1.400 per maand, of €16.800 per jaar. Met de{" "}
            <Link href="/rekenhulp" className={LINK}>kostencalculator</Link> reken je uit wat het voor jouw bedrijf
            is.
          </P>

          <H2>4. Meer Google-reviews</H2>
          <P>
            Met moverAI krijg je meer Google-reviews, omdat je klant na de verhuizing automatisch om een review
            wordt gevraagd. Veel klanten kiezen een verhuizer op basis van de sterren in Google, maar na een
            geslaagde verhuizing denkt bijna niemand er zelf aan om een review te schrijven.
          </P>
          <P>
            Door elke klant op het juiste moment te vragen, bouw je zonder extra werk aan je reputatie. Meer
            sterren betekent meer nieuwe klanten.
          </P>

          <H2>5. Minder halflege ritten</H2>
          <P>
            AI berekent vooraf hoeveel m³ een verhuizing is, zodat je meteen de juiste wagen en de juiste ploeg
            inplant. Zonder goede inschatting stuur je soms een te grote wagen die halfleeg rijdt, of een te kleine
            waardoor je twee keer moet rijden.
          </P>
          <P>
            De AI telt de inboedel per kamer op basis van de foto&apos;s. Jij krijgt bij elke aanvraag de
            foto&apos;s en een inventarislijst, zodat je de planning vooraf kunt controleren.
          </P>

          <H2>6. Minder typewerk</H2>
          <P>
            Met AI hoef je geen meubels meer te tellen of Excel-sheets in te vullen. De AI herkent de inboedel op
            de foto&apos;s, berekent de m³ en maakt de offerte.
          </P>
          <P>
            Die offerte gaat binnen een minuut de deur uit, met jouw naam en jouw tarieven. Je tarieven haalt
            moverAI bij de start uit een oude factuur of offerte, zodat elke offerte meteen klopt met jouw prijzen.
          </P>

          <H2>Offertes maken zonder en met AI: het verschil</H2>
          <Table
            head={["Onderdeel", "Zonder AI", "Met moverAI"]}
            rows={[
              ["Reactie op een aanvraag", "Afspraak plannen voor een voorinspectie", "Linkje sturen, offerte binnen een minuut"],
              ["Inboedel opnemen", "Medewerker rijdt naar de klant", "Klant maakt een paar foto's per kamer"],
              ["Kosten per opname", "Ca. €70 aan uren en brandstof", "Geen rit, geen inspectie-uren"],
              ["Volume berekenen", "m³ schatten en uitrekenen", "AI telt inboedel en m³"],
              ["Offerte opstellen", "Handmatig, in Excel of een sjabloon", "Automatisch, met jouw naam en tarieven"],
              ["Aanvragen buiten kantoortijd", "Wachten tot de volgende werkdag", "Offerte via je website, ook 's avonds en in het weekend"],
              ["Reviews", "Afhankelijk van of de klant er zelf aan denkt", "Automatisch verzoek na de verhuizing"],
            ]}
          />

          <H2>Veelgestelde vragen over de voordelen van AI</H2>
          <H3>{FAQS[0].q}</H3>
          <P>{FAQS[0].a}</P>
          <H3>{FAQS[1].q}</H3>
          <P>{FAQS[1].a}</P>
          <H3>{FAQS[2].q}</H3>
          <P>{FAQS[2].a}</P>
          <H3>{FAQS[3].q}</H3>
          <P>
            Ja. Met <Link href="/onsite" className={LINK}>Onsite</Link> staat er een offerteknop op je eigen
            website. Bezoekers krijgen dan ook &apos;s avonds en in het weekend binnen een minuut een offerte.
          </P>
          <H3>{FAQS[4].q}</H3>
          <P>{FAQS[4].a}</P>
          <H3>{FAQS[5].q}</H3>
          <P>
            Ja, daar is <Link href="/onspot" className={LINK}>Onspot</Link> voor. Je opent moverAI in de browser op
            je telefoon, fotografeert elke ruimte en hebt de offerte ter plekke klaar.
          </P>

          <H2>Conclusie: AI scheelt tijd, geld en klussen</H2>
          <P>
            AI levert een verhuisbedrijf vooral winst op vóór de verhuizing: je reageert sneller op aanvragen, je
            hoeft niet meer voor elke offerte te rijden, en de offerte maakt zichzelf. Daarnaast plan je je wagens
            beter in en krijg je meer reviews.
          </P>
          <P>
            Je probeert moverAI 14 dagen gratis, zonder implementatiekosten. Lees ook{" "}
            <Link href="/blog/ai-verhuisbedrijf-invoeren" className={LINK}>
              hoe je AI in je verhuisbedrijf invoert in 3 stappen
            </Link>
            .
          </P>

          <BlogCta title="Wil je zien wat het voor jouw bedrijf oplevert?">
            <p>Plan een vrijblijvend adviesgesprek van 15 minuten.</p>
          </BlogCta>
        </article>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
        />
      </main>
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
