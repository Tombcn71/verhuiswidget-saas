import Image from "next/image";
import heroImage from "@/public/hero.jpg";
import { DemoModal } from "@/app/_components/demo-modal";
import { SiteHeader } from "@/app/_components/site-header";
import { PricingCards, TrialCard } from "@/app/_components/pricing-cards";
import { WhatsAppButton } from "@/app/_components/whatsapp-button";
import { Globe, Keyboard, Link, MapPin, Star } from "lucide-react";
import {
  Timer,
  Fuel,
  Truck,
  Zap,
  Sparkles,
} from "@/app/_components/icons";

// Hoofdknop: effen merkblauw.
const aiButton =
  "bg-brand-600 text-white shadow-sm transition hover:bg-brand-700";

const features = [
  {
    Icon: Zap,
    title: "Sneller bij offerteplatforms",
    body: "Krijg je een aanvraag via een offerteplatform? App of mail de klant meteen je linkje. Binnen een minuut heeft hij jouw prijs, zonder ruwe schatting en zonder dat je langs hoeft. Boekt hij niet meteen, dan krijgt hij na 2 dagen vanzelf een herinnering.",
  },
  {
    Icon: Timer,
    title: "Minder personeelsuren",
    body: "Niemand hoeft meer langs voor een opname. Je mensen blijven aan het werk: op de wagen of op kantoor.",
  },
  {
    Icon: Fuel,
    title: "Minder brandstofkosten",
    body: "Geen kilometers meer om alleen een inboedel te bekijken, ook niet voor klanten die nooit boeken.",
  },
  {
    Icon: Star,
    title: "Meer Google-reviews",
    body: "Na de verhuizing vragen we je klant automatisch om een review. Meer sterren betekent meer nieuwe klanten.",
  },
  {
    Icon: Truck,
    title: "Minder halflege ritten",
    body: "Je weet vooraf hoeveel m³ het is, dus je stuurt meteen de juiste wagen en de juiste ploeg.",
  },
  {
    Icon: Keyboard,
    title: "Minder typewerk",
    body: "Geen meubels tellen of Excel-sheets invullen. De offerte gaat binnen een minuut de deur uit, met jouw naam en tarieven.",
  },
];

const channels = [
  {
    Icon: Link,
    t: "1. Via een linkje",
    d: "Krijg je een aanvraag via een offerteplatform, een telefoontje of WhatsApp? Stuur de klant je eigen linkje. Hij maakt foto’s per kamer en krijgt binnen een minuut jouw prijs. Jij krijgt de inventaris en het volume binnen.",
  },
  {
    Icon: Globe,
    t: "2. Via je website",
    d: "Komen klanten via Google of social media op je website? Dan vragen ze daar meteen een offerte aan: een paar foto’s per kamer en binnen een minuut jouw prijs. Ook ’s avonds en in het weekend.",
  },
  {
    Icon: MapPin,
    t: "3. Zelf op locatie",
    d: "Sta je bij een groot pand of een lastige klus? Open moverAI in de browser op je telefoon, scan de ruimtes ter plekke en zie de kubieke meters direct oplopen. Geen app nodig.",
  },
];

const faqs = [
  {
    q: "Hoe nauwkeurig is het volume van de AI?",
    a: "De AI herkent de meubels op de foto's en rekent per item met vaste volumes, zoals een bank, kast of bed. Losse spullen telt hij als verhuisdozen. Je klant ziet de lijst en kan aantallen aanpassen of items toevoegen voordat de offerte wordt gemaakt. Jij krijgt de foto's en de volledige inventaris erbij, zodat je het altijd kunt controleren.",
  },
  {
    q: "Wat als de foto's van de klant slecht zijn of er kamers ontbreken?",
    a: "De klant kan per kamer extra foto's toevoegen en ontbrekende spullen zelf invullen. Jij ziet bij elke aanvraag de foto's. Twijfel je, dan bel je even of stuur je een linkje om een kamer opnieuw te scannen.",
  },
  {
    q: "Kan ik mijn eigen tarieven en manier van rekenen gebruiken?",
    a: "Ja. Je kiest of je per uur of per m³ rekent. Daarnaast stel je je uurtarief, verhuiswagen, ploeggrootte, tempo, voorrijkosten, kilometerprijs, minimum aantal uren, afronding, weekendtoeslag, traptijd, verhuislift en extra's in. Nog sneller: upload een oude factuur en de AI vult je tarieven voor je in. Met de testwoningen zie je meteen of de prijs klopt met wat jij zou rekenen.",
  },
  {
    q: "Hoe snel ben ik live, en moet ik iets technisch doen?",
    a: "Binnen een kwartier. Via een linkje werkt het meteen, zonder website. Wil je de widget op je site, dan plak je één regel code in je website-instellingen. In het dashboard staat stap voor stap waar dat zit.",
  },
  {
    q: "Ziet mijn klant moverAI, of mijn eigen merk?",
    a: "Je eigen merk. De widget en de offertemail tonen jouw bedrijfsnaam, kleur en contactgegevens. Je klant ziet nergens moverAI.",
  },
  {
    q: "Wat gebeurt er met de foto's en klantgegevens (AVG)?",
    a: "De foto's worden alleen gebruikt om de inboedel te herkennen en een offerte te maken. Ze worden bewaard bij de aanvraag, zodat jij ze kunt bekijken. Na 3 maanden worden ze automatisch verwijderd. De AI gebruikt de foto's niet om van te leren. Gegevens worden nooit gedeeld of verkocht.",
  },
  {
    q: "Wat gebeurt er na de proefperiode?",
    a: "De eerste 14 dagen zijn gratis en je geeft geen betaalgegevens op. Na de proefperiode wordt er niets automatisch afgeschreven. Wil je doorgaan, dan kies je zelf een pakket.",
  },
  {
    q: "Wat als ik meer scans nodig heb dan in mijn pakket?",
    a: "Dan blijft alles gewoon werken; we blokkeren nooit een aanvraag. Je krijgt een melding en kunt overstappen naar een groter pakket als je wilt.",
  },
  {
    q: "Kan ik op elk moment opzeggen?",
    a: "Ja. Op de pagina Abonnement in je dashboard klik je op \"Abonnement opzeggen\". Een maandabonnement loopt dan door tot het einde van de maand, een jaarabonnement tot het einde van het betaalde jaar. Wil je alles laten wissen, dan verwijder je daar ook je account.",
  },
  {
    q: "Werkt het met mijn website?",
    a: "Ja, met elke website waar je code kunt toevoegen: WordPress, Wix, Squarespace, Shopify en andere. Heb je geen website, gebruik dan het linkje.",
  },
];

// Zodat Google de vragen als FAQ kan tonen.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function HomePage() {
  const calendlyUrl = process.env.CALENDLY_URL;
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative mx-auto w-full max-w-6xl overflow-hidden px-6 pt-16 pb-20">
          <div className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
                <Sparkles className="h-3.5 w-3.5" />
                AI-software voor verhuizers
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Win meer klussen.{" "}
                <span className="text-brand-600">Bespaar uren en brandstof.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Offertes in 1 minuut, zonder voorinspectie. Je klant scant zijn inboedel met de
                telefoon en krijgt direct een offerte met jouw tarieven. Werkt meteen, geen gedoe.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <a
                  href="#prijzen"
                  className={`w-full rounded-full px-6 py-3 text-center font-semibold sm:w-auto ${aiButton}`}>
                  Probeer 14 dagen gratis
                </a>
                <DemoModal calendlyUrl={calendlyUrl ?? null} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground/80">
                Geen betaalgegevens nodig
              </p>
            </div>

            <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl shadow-xl ring-1 ring-border lg:order-last">
              <Image
                src={heroImage}
                alt="Telefoon scant een woonkamer; moverAI herkent de meubels en toont een offerte-indicatie."
                fill
                priority
                placeholder="blur"
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="voordelen"
          className="scroll-mt-20 border-t border-border bg-muted py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Wat win je met <span className="text-primary">AI</span>-offertes?
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-background p-6 shadow-sm">
                  <div className="inline-flex rounded-xl bg-brand-600 p-2.5 text-white">
                    <f.Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA: besparing */}
        <section className="bg-brand-600 py-16">
          <div className="mx-auto w-full max-w-3xl px-6 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight">
              Klaar om te besparen op uren en brandstof?
            </h2>
            <p className="mt-3">
              Elke opname bij een klant thuis kost al snel anderhalf uur, met
              rijden, parkeren en rondlopen, ook als de klant uiteindelijk niet
              boekt. Met moverAI maakt de klant zelf de foto&apos;s en krijgt hij
              binnen een minuut jouw offerte. Jij rijdt alleen nog voor klussen
              die doorgaan.
            </p>
            <p className="mt-4 text-sm italic">
              Rekenvoorbeeld: 20 opnames per maand × 1,5 uur = 30 uur × €45 per
              uur = €1.350. 20 ritten × 10 km heen en terug = 200 km × €0,20
              brandstof per km = €40. Samen €1.390 per maand. moverAI kost vanaf
              €69 per maand.
            </p>
            <a
              href="#prijzen"
              className="mt-6 inline-block rounded-full bg-background px-6 py-3 font-semibold text-brand-700 shadow-sm hover:bg-muted">
              Probeer 14 dagen gratis
            </a>
          </div>
        </section>

        {/* Hoe het werkt */}
        <section id="hoe-het-werkt" className="scroll-mt-20 py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Hoe het werkt: 3 manieren om mover<span className="text-primary">AI</span> in te zetten
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {channels.map((c) => (
                <div
                  key={c.t}
                  className="rounded-xl border border-border bg-background p-6 shadow-sm">
                  <div className="inline-flex rounded-xl bg-brand-600 p-2.5 text-white">
                    <c.Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-semibold">{c.t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Prijzen */}
        <section
          id="prijzen"
          className="scroll-mt-20 border-t border-border bg-muted py-20">
          <div className="mx-auto w-full max-w-5xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Probeer mover<span className="text-primary">AI</span> 14 dagen gratis
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Alle functies, geen betaalgegevens nodig en er wordt niets automatisch afgeschreven.
              Bevalt het? Dan kies je daarna pas een pakket.
            </p>
            <TrialCard primaryButton={aiButton} calendlyUrl={calendlyUrl ?? null} />
            <h3 className="mt-16 text-center text-xl font-semibold tracking-tight">
              Na je proefperiode: kies het pakket dat bij je past
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
              In elk pakket werk je op alle 3 manieren: via je website, via een
              linkje en zelf op locatie. Betaal per maand of per jaar; prijzen exclusief btw.
            </p>
            <PricingCards />
          </div>
        </section>

        {/* Veelgestelde vragen */}
        <section id="faq" className="scroll-mt-20 border-t border-border py-20">
          <div className="mx-auto w-full max-w-3xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Veelgestelde vragen
            </h2>
            <div className="mt-10 divide-y divide-border rounded-xl border border-border bg-background">
              {faqs.map((f) => (
                <details key={f.q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-xl leading-none text-brand-600 transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-foreground/85">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
          />
        </section>

      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} moverAI · White-label AI-widget voor
        verhuizers
      </footer>
      <WhatsAppButton />
    </div>
  );
}
