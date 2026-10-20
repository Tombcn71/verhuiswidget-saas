import Image from "next/image";
import heroImage from "@/public/hero.jpg";
import { DemoModal } from "@/app/_components/demo-modal";
import { SiteHeader } from "@/app/_components/site-header";
import { PricingCards } from "@/app/_components/pricing-cards";
import {
  Timer,
  Fuel,
  Truck,
  TrendingDown,
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
    title: "Personeelsuren",
    body: "Geen reistijd en fysieke voorinspecties; je behoudt dure uren op de werkvloer of op kantoor.",
  },
  {
    Icon: Fuel,
    title: "Brandstofkosten",
    body: "Geen onnodige voorrijkilometers met personenwagens om alleen maar een inboedel te bekijken.",
  },
  {
    Icon: Truck,
    title: "Geen halflege ritten",
    body: "Exacte volumeberekening vooraf zorgt dat je planners altijd de juiste wagenmaat inzetten.",
  },
  {
    Icon: TrendingDown,
    title: "Lagere uitstoot",
    body: "Minder loze kilometers op de teller voor een kleinere ecologische voetafdruk.",
  },
  {
    Icon: Zap,
    title: "Snellere offertes",
    body: "Geen handmatig telwerk of ingewikkelde Excel-sheets; offertes gaan direct automatisch de deur uit.",
  },
  {
    Icon: Monitor,
    title: "24/7 leads & scans",
    body: "Je software verzamelt ook 's avonds en in het weekend automatisch aanvragen en inboedellijsten.",
  },
];

const channels = [
  {
    emoji: "🌐",
    t: "1. Onsite (De Website Widget)",
    d: "Plaats de widget met één regel code op je website. Klanten vullen hun gegevens in, uploaden foto's van hun kamers en de AI doet de rest.",
  },
  {
    emoji: "🔗",
    t: "2. Onlink (Het Directe Linkje)",
    d: "Krijg je een beller of WhatsApp-bericht? Genereer in één klik een uniek linkje vanuit je dashboard en stuur deze naar de klant om direct foto's te uploaden.",
  },
  {
    emoji: "📍",
    t: "3. Onspot (De Mobiele App-Scanner)",
    d: "Sta je zelf bij een groot pand of complex project? Open de moverAI web-app op je telefoon, scan de ruimtes live op locatie en zie direct het aantal kubieke meters rollen.",
  },
];

export default function HomePage() {
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
                AI-software voor verhuizers en ontruimers
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Offertes in 1 minuut.{" "}
                <span className="text-brand-600">Zonder voorinspectie.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600">
                Je klant scant zijn inboedel met de telefoon. moverAI herkent de
                meubels, berekent het volume en stuurt direct een offerte met
                jouw tarieven. Jij hoeft er niet meer voor op pad.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <a
                  href="#prijzen"
                  className={`w-full rounded-full px-6 py-3 text-center font-semibold sm:w-auto ${aiButton}`}>
                  Probeer 14 dagen gratis
                </a>
                <DemoModal />
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Geen betaalgegevens nodig
              </p>
            </div>

            <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl shadow-xl ring-1 ring-slate-200 lg:order-last">
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
          className="scroll-mt-20 border-t border-slate-100 bg-slate-50 py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Waarom verhuizen naar AI offertes?
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="inline-flex rounded-xl bg-brand-600 p-2.5 text-white">
                    <f.Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{f.body}</p>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-16 max-w-3xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-10 sm:text-center">
              <h3 className="text-2xl font-bold tracking-tight">
                Bespaar tot 80% tijd op administratie en taxatie
              </h3>
              <p className="mt-4 text-slate-600">
                Een traditioneel offerteproces kost al snel meer dan twee uur
                per klant: bellen voor een afspraak, op en neer rijden naar de
                woning, door het huis lopen om meubels te noteren, en &apos;s
                avonds op kantoor alles handmatig verwerken.
              </p>
              <p className="mt-4 text-slate-600">
                Met moverAI automatiseer je dit hele proces. Of de klant nu zelf
                foto&apos;s uploadt via je site (Onsite), je een linkje stuurt
                na een telefoontje (Onlink), of je planner zelf ter plaatse de
                app opent (Onspot): onze geavanceerde AI doet binnen een minuut
                de volumeberekening. Zo reduceer je het administratieve proces
                met maar liefst 80 procent.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                  href="#prijzen"
                  className={`rounded-full px-6 py-3 text-center font-semibold ${aiButton}`}>
                  Probeer 14 dagen gratis
                </a>
                <DemoModal />
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Geen betaalgegevens nodig
              </p>
            </div>
          </div>
        </section>

        {/* Hoe het werkt */}
        <section id="hoe-het-werkt" className="scroll-mt-20 py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Hoe het werkt: 3 manieren om te scannen
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {channels.map((c) => (
                <div
                  key={c.t}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-2xl">
                    {c.emoji}
                  </div>
                  <h3 className="mt-4 font-semibold">{c.t}</h3>
                  <p className="mt-2 text-sm text-slate-600">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Prijzen */}
        <section
          id="prijzen"
          className="scroll-mt-20 border-t border-slate-100 bg-slate-50 py-20">
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
                <span>Geen betaalkaart nodig</span>
                <span aria-hidden="true" className="text-emerald-300">
                  ·
                </span>
                <span>Niets wordt automatisch afgeschreven</span>
              </p>
            </div>
            <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
              Elk pakket geeft je team toegang tot alle features: Onsite, Onlink
              én Onspot. Betaal per maand of per jaar; prijzen exclusief btw.
            </p>
            <PricingCards primaryButton={aiButton} />
          </div>
        </section>

        {/* CTA */}
        <section className="bg-brand-600 py-16">
          <div className="mx-auto w-full max-w-3xl px-6 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight">
              Klaar om meer leads te converteren?
            </h2>
            <p className="mt-3 text-white/80">
              Maak binnen 2 minuten een account aan, nodig eventueel je
              teamleden uit, stel je m³-tarieven in en begin vandaag nog met
              slim scannen.
            </p>
            <a
              href="#prijzen"
              className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-semibold text-brand-700 shadow-sm hover:bg-slate-50">
              Gratis starten
            </a>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-8 text-sm text-slate-500">
        © {new Date().getFullYear()} moverAI · White-label AI-widget voor
        verhuizers en ontruimers
      </footer>
    </div>
  );
}
