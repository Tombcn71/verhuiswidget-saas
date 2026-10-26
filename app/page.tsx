import Image from "next/image";
import heroImage from "@/public/hero.jpg";
import { DemoModal } from "@/app/_components/demo-modal";
import { SiteHeader } from "@/app/_components/site-header";
import { PricingCards } from "@/app/_components/pricing-cards";
import { WhatsAppButton } from "@/app/_components/whatsapp-button";
import { Globe, Link, MapPin, Star } from "lucide-react";
import {
  Timer,
  Fuel,
  Truck,
  Zap,
  Monitor,
  Sparkles,
} from "@/app/_components/icons";

// Hoofdknop: effen merkblauw.
const aiButton =
  "bg-brand-600 text-white shadow-sm transition hover:bg-brand-700";

const features = [
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
    Icon: Truck,
    title: "Minder halflege ritten",
    body: "Je weet vooraf hoeveel m³ het is, dus je stuurt meteen de juiste wagen en de juiste ploeg.",
  },
  {
    Icon: Star,
    title: "Meer Google-reviews",
    body: "Na de verhuizing vragen we je klant automatisch om een review. Meer sterren betekent meer nieuwe klanten.",
  },
  {
    Icon: Zap,
    title: "Minder typewerk",
    body: "Geen meubels tellen of Excel-sheets invullen. De offerte gaat binnen een minuut de deur uit, met jouw logo en tarieven.",
  },
  {
    Icon: Monitor,
    title: "Meer aanvragen",
    body: "Klanten scannen wanneer het hun uitkomt, ook 's avonds en in het weekend. Jij krijgt de aanvraag met foto's en inventarislijst.",
  },
];

const channels = [
  {
    Icon: Globe,
    t: "1. Via je website",
    d: "Plaats de widget met één regel code op je site. Je klant vult zijn gegevens in, maakt foto’s van de kamers en krijgt direct een offerte met jouw tarieven.",
  },
  {
    Icon: Link,
    t: "2. Via een linkje",
    d: "Belt er iemand of krijg je een WhatsApp-bericht? Maak in je dashboard met één klik een persoonlijk linkje en stuur het door. Je klant uploadt zijn foto’s, jij krijgt de inventaris en het volume binnen.",
  },
  {
    Icon: MapPin,
    t: "3. Zelf op locatie",
    d: "Sta je bij een groot pand of een lastige klus? Open moverAI in de browser op je telefoon, scan de ruimtes ter plekke en zie de kubieke meters direct oplopen. Geen app nodig.",
  },
];

const startSteps = [
  {
    t: "Start je proefperiode",
    d: "Maak in 2 minuten een account aan. 14 dagen gratis, zonder betaalgegevens.",
  },
  {
    t: "Upload een oude factuur",
    d: "De AI leest je uurtarief, voorrijkosten en kilometerprijs en vult je tarieven voor je in. We lezen alleen de tarieven; de factuur wordt niet bewaard.",
  },
  {
    t: "Ontvang je eerste aanvraag",
    d: "Zet de widget op je website, of stuur klanten gewoon een link via WhatsApp, sms of mail. Werkt meteen.",
  },
];

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
                Offertes in 1 minuut.{" "}
                <span className="text-brand-600">Zonder voorinspectie.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Je klant scant zijn inboedel met de telefoon en krijgt direct
                een offerte met jouw tarieven. Zo bespaar je personeelsuren en
                brandstof. Werkt meteen, geen gedoe.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <a
                  href="#prijzen"
                  className={`w-full rounded-full px-6 py-3 text-center font-semibold sm:w-auto ${aiButton}`}>
                  Probeer 14 dagen gratis
                </a>
                <DemoModal />
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
              €79 per maand.
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

        {/* Zo begin je */}
        <section id="zo-begin-je" className="scroll-mt-20 border-t border-border py-20">
          <div className="mx-auto w-full max-w-5xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">Zo begin je</h2>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {startSteps.map((s, i) => (
                <li key={s.t} className="text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-semibold">{s.t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
                </li>
              ))}
            </ol>
            <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#prijzen"
                className={`w-full rounded-full px-6 py-3 text-center font-semibold sm:w-auto ${aiButton}`}>
                Probeer 14 dagen gratis
              </a>
              {calendlyUrl && (
                <a
                  href={calendlyUrl}
                  target="_blank"
                  rel="noopener"
                  className="w-full rounded-full border border-border bg-background px-6 py-3 text-center font-semibold shadow-sm transition hover:bg-muted sm:w-auto">
                  Plan een gratis adviesgesprek
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Prijzen */}
        <section
          id="prijzen"
          className="scroll-mt-20 border-t border-border bg-muted py-20">
          <div className="mx-auto w-full max-w-5xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Kies je prijsplan
            </h2>
            <div className="mt-5 flex justify-center">
              <p className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
                <span>🎁 Eerste 2 weken gratis</span>
                <span aria-hidden="true" className="text-emerald-300">
                  ·
                </span>
                <span>Geen betaalgegevens nodig</span>
                <span aria-hidden="true" className="text-emerald-300">
                  ·
                </span>
                <span>Niets wordt automatisch afgeschreven</span>
              </p>
            </div>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              In elk pakket werk je op alle 3 manieren: via je website, via een
              linkje en zelf op locatie. Betaal per maand of per jaar; prijzen exclusief btw.
            </p>
            <PricingCards primaryButton={aiButton} />
          </div>
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
