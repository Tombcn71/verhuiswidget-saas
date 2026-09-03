import Link from "next/link";
import { Show } from "@clerk/nextjs";

const features = [
  {
    title: "AI-foto-analyse",
    body: "Klanten uploaden foto's van hun kamers. Google Gemini herkent automatisch de meubels, telt ze en schat het volume in m³.",
  },
  {
    title: "Jouw tarieven, jouw prijs",
    body: "Stel je voorrijkosten, prijs per m³, kilometertarief en toeslagen in. De widget rekent live de offerteprijs uit.",
  },
  {
    title: "Volledig white-label",
    body: "Eén regel code op je eigen website. Je logo, je huisstijlkleur, jouw domein in de e-mails. Klanten zien alleen jouw merk.",
  },
  {
    title: "Complete leads",
    body: "Elke aanvraag komt binnen met contactgegevens, adressen, de volledige inventarislijst en de berekende prijs.",
  },
  {
    title: "Direct een offerte",
    body: "Geen betaalflow — na het invullen krijgt de klant een nette offerte-indicatie per e-mail, en jij de aanvraag met alle details.",
  },
  {
    title: "Verhuizen én ontruimen",
    body: "Werkt voor reguliere verhuizingen en voor woningontruimingen. Zelfde flow, zelfde inzichten.",
  },
];

const steps = [
  { n: "1", t: "Plaats de widget", d: "Kopieer je unieke embed-code en plak 'm op je site." },
  { n: "2", t: "Klant vult in", d: "Contactgegevens, adressen en foto's van elke kamer." },
  { n: "3", t: "AI analyseert", d: "Gemini maakt de inventarislijst en berekent de prijs met jouw tarieven." },
  { n: "4", t: "Jij ontvangt de lead", d: "Compleet met offerte in je mailbox en dashboard." },
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold tracking-tight">
          Verhuis<span className="text-brand-600">Widget</span>
        </span>
        <nav className="flex items-center gap-3 text-sm font-medium">
          <Show when="signed-out">
            <Link href="/inloggen" className="rounded-lg px-3 py-2 text-slate-600 hover:text-slate-900">
              Inloggen
            </Link>
            <Link
              href="/registreren"
              className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
            >
              Gratis starten
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
            >
              Naar dashboard
            </Link>
          </Show>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-6 pt-16 pb-20 text-center">
          <p className="mb-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Voor verhuis- en ontruimingsbedrijven
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Zet foto's van je klant automatisch om in een complete verhuisofferte
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            VerhuisWidget is een white-label widget voor op je eigen website. Je klant uploadt
            foto's, AI telt de meubels en berekent de prijs op basis van jouw tarieven. Jij
            ontvangt een kant-en-klare offerteaanvraag.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/registreren"
              className="w-full rounded-lg bg-brand-600 px-6 py-3 text-center font-semibold text-white hover:bg-brand-700 sm:w-auto"
            >
              Gratis account aanmaken
            </Link>
            <Link
              href="/inloggen"
              className="w-full rounded-lg border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              Inloggen
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-slate-100 bg-slate-50 py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Alles wat je nodig hebt voor online offertes
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hoe het werkt */}
        <section className="py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">Hoe het werkt</h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <div key={s.n}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                    {s.n}
                  </div>
                  <h3 className="mt-4 font-semibold">{s.t}</h3>
                  <p className="mt-1 text-sm text-slate-600">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-slate-100 bg-brand-600 py-16">
          <div className="mx-auto w-full max-w-3xl px-6 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight">Klaar om meer leads te krijgen?</h2>
            <p className="mt-3 text-brand-100">
              Maak een account aan, stel je tarieven in en plaats de widget vandaag nog op je site.
            </p>
            <Link
              href="/registreren"
              className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50"
            >
              Gratis starten
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-8 text-sm text-slate-500">
        © {new Date().getFullYear()} VerhuisWidget · White-label verhuis- en ontruimingswidget
      </footer>
    </div>
  );
}
