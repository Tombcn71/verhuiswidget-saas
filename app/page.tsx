import Image from "next/image";
import Link from "next/link";
import { Show } from "@clerk/nextjs";
import heroImage from "@/public/hero.jpg";
import { DemoModal } from "@/app/_components/demo-modal";
import { Logo } from "@/app/_components/logo";
import { CHANNEL_FEATURES, PLANS, PLAN_ORDER, type Plan, type PlanId } from "@/lib/plans";
import {
  Timer,
  Fuel,
  Truck,
  TrendingDown,
  Zap,
  Monitor,
  Sparkles,
} from "@/app/_components/icons";

// Herbruikbare gradient-knopstijl (Tailwind-utilities, geen custom CSS).
const aiButton =
  "bg-linear-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110";

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

// Teksten per plan; aantallen (gebruikers, scans, prijzen) komen uit `lib/plans.ts`.
const PLAN_TAGLINE: Record<PlanId, string> = {
  basic: "Voor de zelfstandige verhuizer die direct professioneel wil scannen.",
  standard: "Voor groeiende verhuisbedrijven met een kantoor- of planningsteam.",
  premium: "Voor de grotere verhuisketens met meerdere planners en taxateurs op de weg.",
};

const PLAN_EXTRA: Record<PlanId, string> = {
  basic: "Tarieven volledig instelbaar: m³, km en toeslagen",
  standard: "Uitgebreid dashboard voor planners",
  premium: "Voorrang bij support",
};

function planFeatures(plan: Plan): string[] {
  const seats =
    plan.seats === 1
      ? "1 actieve gebruiker (seat)"
      : plan.extraSeatCents !== null
        ? `Max. ${plan.seats} gebruikers inclusief (extra gebruikers los toe te voegen voor €${plan.extraSeatCents / 100}/md)`
        : `Max. ${plan.seats} gebruikers (seats) om flexibel samen te werken`;
  const scans =
    plan.scans === null
      ? "Onbeperkt aantal AI-scans per maand (geen extra kosten)"
      : `Inclusief ${plan.scans} AI-scans per maand`;
  return [
    ...CHANNEL_FEATURES,
    seats,
    scans,
    "White-label: je eigen logo en huisstijlkleuren",
    PLAN_EXTRA[plan.id],
  ];
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="mt-0.5 h-4 w-4 shrink-0 text-brand-600">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-3 text-sm font-medium">
          <Link
            href="#prijzen"
            className="hidden rounded-lg px-3 py-2 text-slate-600 hover:text-slate-900 sm:block">
            Prijzen
          </Link>
          <Show when="signed-out">
            <Link
              href="/inloggen"
              className="rounded-lg px-3 py-2 text-slate-600 hover:text-slate-900">
              Inloggen
            </Link>
            <Link
              href="/#prijzen"
              className={`rounded-lg px-4 py-2 ${aiButton}`}>
              Gratis starten
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className={`rounded-lg px-4 py-2 ${aiButton}`}>
              Naar dashboard
            </Link>
          </Show>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative mx-auto w-full max-w-6xl overflow-hidden px-6 pt-16 pb-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-linear-to-br from-blue-400 to-violet-400 opacity-40 blur-3xl sm:h-96 sm:w-96"
          />
          <div className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-violet-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                AI-software voor verhuizers en ontruimers
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Laat AI binnen{" "}
                <span className="bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  1 minuut
                </span>{" "}
                je verhuis- en ontruimingsoffertes berekenen en versturen
              </h1>
              <p className="mt-6 text-lg text-slate-600">
                moverAI is de ultieme workflow-tool voor de moderne verhuizer.{" "}
                <strong className="text-slate-900">Onsite</strong> op je website
                via onze slimme widget,{" "}
                <strong className="text-slate-900">Onlink</strong> via een direct
                sms- of WhatsApp-linkje naar je klant, of{" "}
                <strong className="text-slate-900">Onspot</strong> als mobiele
                scanner in de hand van je taxateur. De AI herkent meubels binnen
                60 seconden, berekent het exacte volume op basis van jouw tarieven
                en stuurt direct een kant-en-klare offerte naar de klant én jouw
                dashboard.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href="/#prijzen"
                  className={`w-full rounded-lg px-6 py-3 text-center font-semibold sm:w-auto ${aiButton}`}>
                  Probeer 14 dagen gratis
                </Link>
                <DemoModal />
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Geen betaalgegevens nodig
              </p>
            </div>

            <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl shadow-[0_30px_70px_-25px_rgba(79,70,229,0.45)] ring-1 ring-violet-500/15 lg:order-last">
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
        <section className="border-t border-slate-100 bg-slate-50 py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Waarom verhuizen naar AI offertes?
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="inline-flex rounded-xl bg-linear-to-br from-blue-600 to-violet-600 p-2.5 text-white">
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
                foto&apos;s uploadt via je site (Onsite), je een linkje stuurt na
                een telefoontje (Onlink), of je planner zelf ter plaatse de app
                opent (Onspot): onze geavanceerde AI doet binnen een minuut de
                volumeberekening. Zo reduceer je het administratieve proces met
                maar liefst 80 procent.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/#prijzen"
                  className={`rounded-lg px-6 py-3 text-center font-semibold ${aiButton}`}>
                  Probeer 14 dagen gratis
                </Link>
                <DemoModal />
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Geen betaalgegevens nodig
              </p>
            </div>
          </div>
        </section>

        {/* Hoe het werkt */}
        <section className="py-20">
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
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              Elk pakket geeft je team toegang tot alle features: Onsite, Onlink
              én Onspot. Tarieven zijn per maand, maandelijks opzegbaar en
              exclusief btw. Probeer 14 dagen gratis, zonder betaalkaart.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {PLAN_ORDER.map((id) => PLANS[id]).map((plan) => {
                const featured = plan.id === "standard";
                return (
                <div
                  key={plan.id}
                  className={
                    featured
                      ? "rounded-2xl bg-linear-to-br from-blue-600 to-violet-600 p-px shadow-xl shadow-indigo-500/25"
                      : ""
                  }>
                  <div
                    className={`relative flex h-full flex-col bg-white p-8 ${
                      featured
                        ? "rounded-[15px]"
                        : "rounded-2xl border border-slate-200 shadow-sm"
                    }`}>
                    {featured && (
                      <span className="absolute -top-3 left-8 rounded-full bg-linear-to-br from-blue-600 to-violet-600 px-3 py-1 text-xs font-semibold text-white">
                        Populair
                      </span>
                    )}
                    <h3 className="text-lg font-semibold">
                      {plan.label}{" "}
                      <span className="font-normal text-slate-500">
                        ({plan.audience})
                      </span>
                    </h3>
                    <p className="mt-1 min-h-11 text-sm text-slate-600">
                      {PLAN_TAGLINE[plan.id]}
                    </p>
                    <p className="mt-5 flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight">
                        €{plan.priceCents / 100}
                      </span>
                      <span className="text-sm text-slate-500">/ maand</span>
                    </p>
                    <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-600">
                      {planFeatures(plan).map((f) => (
                        <li key={f} className="flex gap-2.5">
                          <CheckIcon />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/kies-plan?plan=${plan.id}`}
                      className={`mt-8 rounded-lg px-6 py-3 text-center font-semibold ${
                        featured
                          ? aiButton
                          : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}>
                      Kies {plan.label}
                    </Link>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-linear-to-br from-blue-600 via-indigo-600 to-violet-700 py-16">
          <div className="mx-auto w-full max-w-3xl px-6 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight">
              Klaar om meer leads te converteren?
            </h2>
            <p className="mt-3 text-white/80">
              Maak binnen 2 minuten een account aan, nodig eventueel je
              teamleden uit, stel je m³-tarieven in en begin vandaag nog met
              slim scannen.
            </p>
            <Link
              href="/#prijzen"
              className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-indigo-700 shadow-lg hover:bg-slate-50">
              Gratis starten
            </Link>
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
