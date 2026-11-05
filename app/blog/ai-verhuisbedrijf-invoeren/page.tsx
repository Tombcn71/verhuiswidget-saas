import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import heroImage from "@/public/blog-ai-verhuisbedrijf.jpg";
import { SiteHeader } from "@/app/_components/site-header";
import { SiteFooter } from "@/app/_components/site-footer";
import { WhatsAppButton } from "@/app/_components/whatsapp-button";
import { Author, BlogCta, H2, H3, LINK, P, Table, Wint } from "@/app/blog/_components/blog-parts";

const TITLE = "Hoe voer je AI in je verhuisbedrijf in? Zo begin je in 3 stappen";
const DESCRIPTION =
  "AI invoeren in je verhuisbedrijf hoeft geen maanden te duren. Zo begin je in 3 stappen, zonder implementatiekosten, in 14 dagen gratis proeftijd.";

export const metadata: Metadata = {
  title: "Hoe voer je AI in je verhuisbedrijf in? In 3 stappen",
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article", images: [heroImage.src] },
};

const FAQS = [
  {
    q: "Kan AI een verhuisofferte maken zonder voorinspectie?",
    a: "Ja. De klant maakt een paar foto's per kamer met zijn telefoon. De AI herkent de inboedel, berekent het aantal m³ en maakt binnen een minuut een offerte met jouw tarieven. Je krijgt de foto's en een inventarislijst erbij, zodat je de offerte kunt controleren.",
  },
  {
    q: "Hoe nauwkeurig is een offerte op basis van foto's?",
    a: "Dat test je zelf in stap 2. Met Onspot maak je foto's bij een voorinspectie die je toch al doet, en vergelijk je de uitkomst met je eigen offerte. Wijkt de prijs af, dan stel je je tarieven bij tot hij klopt.",
  },
  {
    q: "Moet ik mijn manier van werken veranderen?",
    a: "Nee. Je kunt moverAI eerst naast je huidige werkwijze gebruiken. Pas als de prijzen kloppen, laat je klanten zelf foto's maken.",
  },
  {
    q: "Moet mijn personeel een training volgen?",
    a: "Nee. Onspot open je in de browser op je telefoon, je hoeft niets te installeren. Bij Onlink en Onsite maakt de klant zelf de foto's.",
  },
  {
    q: "Wat gebeurt er met de factuur die ik upload?",
    a: "De AI haalt alleen je tarieven uit de factuur of offerte. De factuur zelf wordt niet bewaard.",
  },
  {
    q: "Hoe zet ik de offerteknop op mijn website?",
    a: "Met 1 regel code. Die plak je zelf in je website, of je stuurt hem naar je webbouwer. De knop opent moverAI in jouw huisstijl.",
  },
  {
    q: "Werkt het ook voor aanvragen via offerteplatforms en WhatsApp?",
    a: "Ja, daar is Onlink voor. Je stuurt de klant een linkje per mail of WhatsApp, en hij heeft binnen een minuut jouw offerte. Zo ben je vaak eerder dan andere verhuizers die dezelfde aanvraag krijgen.",
  },
  {
    q: "Wat kost moverAI?",
    a: "Er zijn geen implementatiekosten, en je probeert alles 14 dagen gratis.",
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

          <div className="relative mt-8 aspect-6/5 w-full overflow-hidden rounded-2xl shadow-xl ring-1 ring-border">
            <Image
              src={heroImage}
              alt="Verhuizer maakt met de moverAI-app foto's van een woonkamer voor een offerte"
              fill
              priority
              placeholder="blur"
              sizes="(min-width: 768px) 48rem, 100vw"
              className="object-cover object-center"
            />
          </div>

          <p className="mt-10 rounded-xl bg-muted px-5 py-4 text-lg leading-relaxed">
            <strong>Kort antwoord:</strong> AI invoeren in je verhuisbedrijf kan in drie stappen, zonder je
            werkwijze om te gooien. Je laat de AI je tarieven uit een oude factuur halen, test de offertes
            naast je eigen voorinspecties, en laat daarna klanten zelf foto&apos;s maken via een linkje of je
            website. Met moverAI kost dat geen implementatiekosten en probeer je alles in een gratis
            proefperiode van 14 dagen.
          </p>

          <H2>Wat doet AI in een verhuisbedrijf?</H2>
          <P>
            In een verhuisbedrijf neemt AI vooral het werk vóór de verhuizing over: het opnemen van de
            inboedel en het maken van de offerte. De klant of de verhuizer maakt een paar foto&apos;s per
            kamer. De AI herkent daarop de meubels en dozen, telt de inboedel en berekent het aantal m³. Op
            basis daarvan en van jouw tarieven staat er binnen een minuut een offerte klaar.
          </P>
          <P>Dat vervangt een groot deel van het werk dat nu handmatig gaat:</P>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-lg leading-relaxed">
            <li><strong>De voorinspectie:</strong> je hoeft niet meer naar de klant om de inboedel te bekijken.</li>
            <li><strong>Het tellen:</strong> geen meubels tellen of kubieke meters schatten op een lijstje.</li>
            <li><strong>Het typewerk:</strong> geen Excel-sheet of offertesjabloon meer invullen.</li>
            <li><strong>De planning:</strong> je weet vooraf hoeveel m³ het is, dus je stuurt meteen de juiste wagen en ploeg.</li>
          </ul>
          <P>
            Jij krijgt bij elke aanvraag de foto&apos;s en een inventarislijst, zodat je altijd kunt
            controleren waar de offerte op gebaseerd is.
          </P>

          <H2>Waarom zien verhuizers AI als een groot project?</H2>
          <P>
            Veel verhuizers denken dat AI invoeren maanden werk kost, met training voor iedereen, een hoop
            gedoe en hoge kosten. Dat is begrijpelijk. Je hebt het druk, de wagens moeten rijden, en een
            systeem dat je hele bedrijf overhoop haalt is het laatste waar je op zit te wachten.
          </P>
          <P>Die zorg klopt voor veel grote softwaresystemen, maar niet voor moverAI:</P>
          <Table
            head={["Wat verhuizers verwachten", "Hoe het bij moverAI gaat"]}
            rows={[
              ["Maanden voorbereiding", "Je begint met één oude factuur of offerte"],
              ["Alles in één keer omgooien", "Je test eerst naast je eigen werkwijze"],
              ["Training voor het hele team", "Je klant maakt de foto's, of jij met je telefoon in de browser"],
              ["Hoge implementatiekosten", "Geen implementatiekosten"],
              ["Een website laten ombouwen", "De widget plaats je met 1 regel code"],
              ["Risico dat het niet past", "14 dagen gratis proberen, met persoonlijke ondersteuning"],
            ]}
          />

          <H2>Hoe voer je AI in je verhuisbedrijf in? De 3 stappen</H2>
          <P>
            Je voert AI in je verhuisbedrijf in door klein te beginnen: eerst je eigen prijzen, dan een test
            naast je huidige werk, en pas daarna offertes zonder voorinspectie. Zo bepaal je zelf het tempo.
          </P>

          <H3>Stap 1: laat de AI je tarieven uit een oude factuur halen</H3>
          <P>
            Upload een oude factuur of offerte. De AI haalt er je eigen tarieven uit, zodat je niet alles zelf
            hoeft in te vullen. De factuur zelf wordt niet bewaard, alleen je tarieven worden overgenomen.
          </P>
          <Wint>elke offerte rekent vanaf het begin met jouw prijzen, niet met een standaardtarief.</Wint>

          <H3>Stap 2: test Onspot naast je eigen voorinspectie</H3>
          <P>
            <Link href="/onspot" className={LINK}>Onspot</Link> is moverAI op je telefoon, voor als je zelf
            bij de klant staat. Je opent het in de browser, dus je hoeft niets te installeren. Doe je toch al
            een voorinspectie? Fotografeer dan elke ruimte met Onspot. Je ziet de inboedel en de m³ per ruimte
            oplopen. Vergelijk de uitkomst daarna met je eigen offerte.
          </P>
          <P>
            Wijkt de prijs af, dan stel je je tarieven bij tot de offerte precies op jouw prijs uitkomt. Zo
            test je de AI zonder risico: je klant krijgt gewoon de offerte die je anders ook had gemaakt.
          </P>
          <Wint>je weet zeker dat de prijzen kloppen, en je klant kan zijn offerte direct ter plekke krijgen.</Wint>

          <H3>Stap 3: laat klanten zelf foto&apos;s maken met Onlink en Onsite</H3>
          <P>Kloppen je prijzen, dan hoef je niet meer zelf naar de klant. Daarvoor zijn twee functies:</P>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-lg leading-relaxed">
            <li>
              <Link href="/onlink" className={LINK}>Onlink</Link>: voor aanvragen via een offerteplatform, de
              telefoon of WhatsApp. Je tikt het e-mailadres in of stuurt het linkje via WhatsApp, het bericht
              staat al klaar. De klant maakt foto&apos;s van zijn kamers met zijn telefoon en heeft binnen een
              minuut jouw offerte.
            </li>
            <li>
              <Link href="/onsite" className={LINK}>Onsite</Link>: een knop op je eigen website die moverAI
              opent in jouw huisstijl. Bezoekers maken een paar foto&apos;s per kamer en krijgen binnen een
              minuut een offerte, ook &apos;s avonds en in het weekend. Je plaatst hem met 1 regel code, of
              stuurt die naar je webbouwer.
            </li>
          </ul>
          <P>Bij beide krijg jij de aanvraag met foto&apos;s en inventarislijst.</P>
          <Wint>
            je bent er als eerste bij op offerteplatforms, terwijl andere verhuizers nog een afspraak
            inplannen. En je website maakt offertes, ook als jij niet achter je bureau zit.
          </Wint>

          <H2>Wat kost een voorinspectie, en wat bespaar je?</H2>
          <P>
            Een voorinspectie kost een verhuisbedrijf ongeveer €70, ook als de klant uiteindelijk niet boekt.
            Dat bedrag bestaat uit personeelsuren en brandstof:
          </P>
          <Table
            head={["Kostenpost", "Bedrag"]}
            boldLast
            rows={[
              ["Anderhalf uur à €45", "€67,50"],
              ["10 km brandstof à €0,25", "€2,50"],
              ["Totaal per voorinspectie", "€70"],
            ]}
          />
          <P>Per maand loopt dat snel op. Een rekenvoorbeeld bij €70 per voorinspectie:</P>
          <Table
            head={["Voorinspecties per maand", "Kosten per maand", "Kosten per jaar"]}
            rows={[
              ["10", "€700", "€8.400"],
              ["20", "€1.400", "€16.800"],
              ["40", "€2.800", "€33.600"],
            ]}
          />
          <P>
            Niet elke voorinspectie levert een klus op. Juist die inspecties zijn verloren tijd en brandstof.
            Met Onlink en Onsite maakt de klant zelf de foto&apos;s, dus die kosten vallen weg.
          </P>
          <P>
            Daarnaast win je tijd op het maken van de offerte zelf: geen meubels tellen, geen m³ schatten,
            geen Excel-sheet invullen. Met de{" "}
            <Link href="/rekenhulp" className={LINK}>kostencalculator</Link> reken je uit wat het voor jouw
            bedrijf scheelt.
          </P>

          <H2>Hoe lang duurt het voordat AI werkt in je bedrijf?</H2>
          <P>
            Met moverAI kun je binnen de proefperiode van 14 dagen alle drie de stappen doorlopen. Hoe snel je
            gaat, bepaal je zelf:
          </P>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-lg leading-relaxed">
            <li><strong>Dag 1:</strong> je uploadt een oude factuur, en je tarieven staan erin.</li>
            <li><strong>Bij je volgende voorinspecties:</strong> je test Onspot naast je eigen offerte en stelt je tarieven bij waar nodig.</li>
            <li><strong>Zodra de prijzen kloppen:</strong> je stuurt klanten een Onlink-linkje en zet de Onsite-knop op je website.</li>
          </ol>
          <P>
            Je hoeft niet alle stappen te nemen. Onlink, Onspot en Onsite zitten alle drie in het pakket, en
            je kiest zelf wat bij jouw bedrijf past. Tijdens de proefperiode krijg je persoonlijke
            ondersteuning.
          </P>

          <H2>Veelgestelde vragen over AI in een verhuisbedrijf</H2>
          {FAQS.map((f) => (
            <div key={f.q}>
              <H3>{f.q}</H3>
              <P>{f.a}</P>
            </div>
          ))}

          <H2>Conclusie: AI invoeren hoeft geen groot project te zijn</H2>
          <P>
            AI in je verhuisbedrijf invoeren kost geen maanden en geen implementatiekosten. Je begint met één
            oude factuur, test de offertes naast je eigen voorinspecties, en laat daarna klanten zelf
            foto&apos;s maken via een linkje of je website. Zo bespaar je op voorinspecties van ongeveer €70
            per stuk, en ben je vaker als eerste bij met een offerte.
          </P>

          <BlogCta title="Wil je zien hoe dit er voor jouw bedrijf uitziet?">
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
