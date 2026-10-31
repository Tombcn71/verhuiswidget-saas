import Image from "next/image";
import NextLink from "next/link";
import heroImage from "@/public/hero.jpg";
import { SiteHeader } from "@/app/_components/site-header";
import { SiteFooter } from "@/app/_components/site-footer";
import { WhatsAppButton } from "@/app/_components/whatsapp-button";
import { PlatformShowcase } from "@/app/_components/platform-showcase";
import { PlanDemoButton } from "@/app/_components/plan-demo-button";
import { HeroTimer } from "@/app/_components/hero-timer";
import { VisitCalculator } from "@/app/_components/visit-calculator";
import { SOLUTIONS } from "@/app/_components/solutions";
import { ArrowRight, Check, Keyboard, Star, X } from "lucide-react";
import {
  Timer,
  Fuel,
  Truck,
  Zap,
  Sparkles,
} from "@/app/_components/icons";

const features = [
  {
    Icon: Zap,
    title: "Sneller bij offerteplatforms",
    body: "App of mail de klant meteen je linkje. Binnen een minuut heeft hij jouw offerte, zonder dat je langs hoeft.",
  },
  {
    Icon: Timer,
    title: "Minder personeelsuren",
    body: "Geen bezoek aan huis meer nodig. Je mensen blijven aan het werk: op de wagen of op kantoor.",
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

// "Kies hoe jij werkt": korte uitleg per oplossing; de eigen pagina vertelt de rest.
const SOLUTION_BLURB: Record<string, string> = {
  "/onlink":
    "Aanvraag via een offerteplatform, telefoon of WhatsApp? Stuur je klant een linkje en binnen een minuut heeft hij jouw offerte.",
  "/onsite":
    "Een knop op je eigen website. Bezoekers vragen meteen een offerte aan, ook 's avonds en in het weekend.",
  "/onspot":
    "Scan zelf bij de klant of bij een groot pand. Zie de m³ direct oplopen en heb de offerte ter plekke klaar.",
};

// Voor en na: herkenbaar voor elke verhuizer.
const WITHOUT = [
  "Een bezoek aan huis plannen, vaak pas over een paar dagen",
  "Rijden, parkeren en 1,5 uur rondlopen",
  "Daarna nog de offerte uitwerken, binnen 24 uur",
  "De klant heeft intussen een ander gekozen",
];
const WITH = [
  "Aanvraag binnen: stuur je linkje",
  "Je klant maakt een paar foto's per kamer",
  "Binnen een minuut jouw offerte, met jouw tarieven",
  "Jij rijdt alleen nog voor klussen die doorgaan",
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
    a: "Je krijgt ruim op tijd een melding en een mail, bij 80% en als ze op zijn. Zijn ze op, dan mis je geen aanvraag: je klant laat zijn gegevens achter en jij belt hem terug, alleen zonder directe prijs. Met een groter pakket werkt alles meteen weer.",
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
  const calendlyUrl = process.env.CALENDLY_URL ?? null;
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
              <div className="mt-8">
                <PlanDemoButton href={calendlyUrl} from="home kop" className="w-full sm:w-auto" />
                <p className="mt-3 text-sm text-muted-foreground">5 minuten · vrijblijvend</p>
              </div>
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
              <HeroTimer />
            </div>
          </div>
        </section>

        {/* Voor en na */}
        <section className="border-t border-border bg-muted py-20">
          <div className="mx-auto w-full max-w-5xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Van dagen naar <span className="text-primary">één minuut</span>
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Zonder moverAI
                </p>
                <ul className="mt-4 space-y-3">
                  {WITHOUT.map((t) => (
                    <li key={t} className="flex gap-3 text-muted-foreground">
                      <X className="mt-0.5 size-5 shrink-0 text-red-500" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-brand-600 bg-background p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
                  Met moverAI
                </p>
                <ul className="mt-4 space-y-3">
                  {WITH.map((t) => (
                    <li key={t} className="flex gap-3 font-medium">
                      <Check className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Rekenhulp */}
        <section className="py-20">
          <div className="mx-auto w-full max-w-3xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Wat kosten bezoeken aan huis <span className="text-primary">jou</span>?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
              Schuif naar hoeveel bezoeken je per week doet.
            </p>
            <div className="mt-10">
              <VisitCalculator />
            </div>
            <div className="mt-8 text-center">
              <p className="font-semibold">Benieuwd hoeveel jij daarvan kunt besparen?</p>
              <PlanDemoButton href={calendlyUrl} from="home rekenhulp" className="mt-4" />
            </div>
          </div>
        </section>

        {/* Kies hoe jij werkt */}
        <section id="hoe-het-werkt" className="scroll-mt-20 border-t border-border bg-muted py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">Kies hoe jij werkt</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {SOLUTIONS.map((s) => (
                <NextLink
                  key={s.href}
                  href={s.href}
                  className="group flex flex-col rounded-xl border border-border bg-background p-6 shadow-sm transition hover:border-brand-600"
                >
                  <div className="inline-flex w-fit rounded-xl bg-brand-600 p-2.5 text-white">
                    <s.Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    {s.name} <span className="font-normal text-muted-foreground">· {s.sub}</span>
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{SOLUTION_BLURB[s.href]}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                    Bekijk hoe <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                  </span>
                </NextLink>
              ))}
            </div>
          </div>
        </section>

        <PlatformShowcase />

        {/* Features */}
        <section
          id="voordelen"
          className="scroll-mt-20 border-t border-border bg-muted py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Wat win je met mover<span className="text-primary">AI</span>?
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

        {/* Persoonlijk */}
        <section className="py-20">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 text-center sm:flex-row sm:text-left">
            <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-brand-600 text-3xl font-bold text-white">
              T
            </div>
            <div>
              <p className="text-lg">
                &ldquo;Ik ben Tom, oprichter van moverAI. Ik bouw het samen met verhuizers, zodat het
                past bij hoe jullie werken. In een demogesprek van 5 minuten laat ik zien wat het voor jouw
                bedrijf doet.&rdquo;
              </p>
              <PlanDemoButton href={calendlyUrl} from="home tom" className="mt-5" />
            </div>
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

        {/* Afsluiter */}
        <section className="bg-brand-600 py-16">
          <div className="mx-auto w-full max-w-3xl px-6 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight">
              Klaar om te besparen op uren en brandstof?
            </h2>
            <p className="mt-3">
              In 5 minuten laat ik zien hoe je klant binnen een minuut jouw offerte krijgt, met jouw
              tarieven. Jij rijdt alleen nog voor klussen die doorgaan.
            </p>
            <PlanDemoButton
              href={calendlyUrl}
              from="home onderaan"
              className="mt-6 bg-background text-brand-700 hover:bg-muted"
            />
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
