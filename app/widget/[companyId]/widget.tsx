"use client";

import { useEffect, useRef, useState } from "react";
import type { LeadSource } from "@/lib/leads";
import { track } from "@vercel/analytics";
import { Bell, Calculator, Camera, Inbox, Mail, Send, Zap } from "lucide-react";
import { Logo, LogoMark } from "@/app/_components/logo";
import { MoveFlow, type DemoContact } from "./move-flow";
import { ContactFallback } from "./contact-fallback";

type CompanyPublic = {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  phone: string | null;
  serviceType: "verhuizen" | "ontruimen" | "beide";
};

// Huisstijlkleur van de verhuizer (white-label); gezet als --accent op de widget.
const ACCENT_BG = "bg-(--accent)";

// Startscherm van de marketing-demo: de bezoeker is een verhuizer, dus eerst
// uitleggen dat hij nu de kant van zijn klant ziet.
const DEMO_STEPS = [
  {
    Icon: Camera,
    title: "Foto's per kamer",
    text: "Je klant fotografeert zijn kamers. Geen woning bij de hand? Gebruik een voorbeeldwoning.",
  },
  { Icon: LogoMark, title: "AI telt de inboedel", text: "Herkent de meubels en berekent de m³." },
  { Icon: Calculator, title: "Direct de prijs", text: "Met de opbouw: ploeg, uren, wagen en kilometers." },
  {
    Icon: Mail,
    title: "Meteen in je mailbox",
    text: "De offerte van je klant, én de aanvraag zoals jij hem binnenkrijgt.",
  },
];

// Eerste scherm van de marketing-demo: wat moverAI voor de verhuizer zelf doet.
const MOVER_STEPS = [
  {
    Icon: Inbox,
    title: "Aanvraag binnen",
    text: "Via een offerteplatform, je website, de telefoon of WhatsApp.",
  },
  {
    Icon: Send,
    title: "Eén klik en je linkje is verstuurd",
    text: "Tik het e-mailadres in of stuur het via WhatsApp. Het bericht staat al klaar. Via je website gaat het vanzelf.",
  },
  {
    Icon: Zap,
    title: "Je klant krijgt direct jouw offerte",
    text: "Nog voordat je concurrent heeft teruggebeld.",
  },
  {
    Icon: Bell,
    title: "Boekt hij niet meteen?",
    text: "Na 2 dagen krijgt hij vanzelf een herinnering.",
  },
];

export function Widget({
  company,
  demo = false,
  preview = false,
  source = "onsite",
  backUrl = null,
  showName = false,
  demoContact,
  prospect,
  calendlyUrl = null,
  limitReached = false,
}: {
  company: CompanyPublic;
  demo?: boolean;
  preview?: boolean;
  source?: LeadSource;
  /** Website van de verhuizer, alleen op de losse pagina (Onlink). */
  backUrl?: string | null;
  /** Bedrijfsnaam bovenin; alleen op de losse pagina (in de pop-up zit de klant al op hun site). */
  showName?: boolean;
  /** Persoonlijke demolink (/demo/<slug>): gegevens van het benaderde verhuisbedrijf. */
  demoContact?: DemoContact;
  /** Slug van de prospect in de verkoop-CRM, voor het bijhouden van de demo. */
  prospect?: string;
  /** Demo: "Plan een adviesgesprek" op het slotscherm. */
  calendlyUrl?: string | null;
  /** Scans van de verhuizer op: alleen een contactformulier, geen scan of prijs. */
  limitReached?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  // Alle accenten in de widget (knoppen, toggles, koppen) in de kleur van de verhuizer.
  const accentStyle = { "--accent": company.primaryColor } as React.CSSProperties;

  const showToggle = company.serviceType === "beide";
  const forcedType: "verhuizing" | "ontruiming" | null =
    company.serviceType === "ontruimen"
      ? "ontruiming"
      : company.serviceType === "verhuizen"
        ? "verhuizing"
        : null;

  // Het startscherm tonen we alleen in de losse marketing-demo.
  const [started, setStarted] = useState(!demo);
  // Demo-intro: eerst "Zo werkt het voor jou", dan "Zo ziet jouw klant het".
  const [introScreen, setIntroScreen] = useState<"jou" | "klant">("jou");
  const [moveType, setMoveType] = useState<"verhuizing" | "ontruiming">(
    forcedType ?? "verhuizing",
  );
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const post = () => {
      window.parent?.postMessage(
        { type: "verhuiswidget:height", id: company.id, height: el.scrollHeight },
        "*",
      );
    };
    post();
    const ro = new ResizeObserver(post);
    ro.observe(el);
    return () => ro.disconnect();
  }, [company.id, started, moveType]);

  if (demo && !started) {
    const forMover = introScreen === "jou";
    const steps = forMover ? MOVER_STEPS : DEMO_STEPS;
    return (
      <div
        ref={rootRef}
        style={accentStyle}
        className="flex h-full min-h-dvh flex-col justify-center bg-linear-to-b from-slate-50 to-white px-6 py-10 text-center text-slate-900"
      >
        {!forMover && (
          <button
            onClick={() => setIntroScreen("jou")}
            className="mx-auto mb-4 block w-full max-w-sm text-left text-xs text-slate-500 hover:text-slate-700"
          >
            ‹ Terug
          </button>
        )}
        <Logo className="mx-auto text-base" />
        {forMover && demoContact?.name && (
          <p className="mt-6 text-sm font-medium text-slate-600">Hoi {demoContact.name}!</p>
        )}
        <h2
          className={`${forMover && demoContact?.name ? "mt-2" : "mt-6"} text-3xl font-bold tracking-tight`}
        >
          {forMover ? (
            <>
              Zo werkt het voor <span className="text-(--accent)">jou</span>
            </>
          ) : (
            <>
              Zo ziet <span className="text-(--accent)">jouw klant</span> het
            </>
          )}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {forMover
            ? "Reageer op elke aanvraag binnen een minuut."
            : "Probeer het zelf, het duurt een minuut."}
        </p>

        <ol className="mx-auto mt-8 w-full max-w-sm space-y-2.5 text-left">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-(--accent)">
                <s.Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="text-sm">
                <span className="block font-semibold">
                  <span className="text-slate-400">{i + 1}.</span> {s.title}
                </span>
                <span className="block text-slate-600">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>

        <button
          onClick={() => {
            if (forMover) return setIntroScreen("klant");
            // Vercel Analytics: hoeveel bezoekers de demo echt starten (website of CRM-link).
            track("Demo gestart", { via: prospect ? "CRM-link" : "website" });
            setStarted(true);
          }}
          className={`mx-auto mt-8 block w-full max-w-sm rounded-full px-10 py-3.5 text-sm font-semibold text-white shadow-lg ${ACCENT_BG}`}
        >
          {forMover ? "Volgende: zo ziet je klant het →" : "Start de demo"}
        </button>
        {!forMover && <p className="mt-3 text-xs text-slate-400">Werkt het best op je telefoon</p>}
      </div>
    );
  }

  if (limitReached) {
    return (
      <div ref={rootRef} style={accentStyle} className="bg-white text-slate-900">
        <ContactFallback
          company={company}
          source={source}
          showName={showName}
          showToggle={showToggle}
          forcedType={forcedType}
        />
      </div>
    );
  }

  return (
    <div ref={rootRef} style={accentStyle} className="bg-white text-slate-900">
      <MoveFlow
        company={company}
        demo={demo}
        preview={preview}
        source={source}
        backUrl={backUrl}
        showName={showName}
        demoContact={demoContact}
        prospect={prospect}
        calendlyUrl={calendlyUrl}
        appChrome
        showToggle={showToggle}
        moveType={moveType}
        setMoveType={setMoveType}
        step={step}
        setStep={setStep}
        onBackToIntro={demo ? () => setStarted(false) : undefined}
      />
    </div>
  );
}
