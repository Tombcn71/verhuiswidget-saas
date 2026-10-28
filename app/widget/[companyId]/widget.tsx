"use client";

import { useEffect, useRef, useState } from "react";
import type { LeadSource } from "@/lib/leads";
import { Calculator, Camera, Mail } from "lucide-react";
import { Logo, LogoMark } from "@/app/_components/logo";
import { MoveFlow, type DemoContact } from "./move-flow";

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
    return (
      <div
        ref={rootRef}
        style={accentStyle}
        className="flex h-full min-h-dvh flex-col justify-center bg-linear-to-b from-slate-50 to-white px-6 py-10 text-center text-slate-900"
      >
        <Logo className="mx-auto text-base" />
        {demoContact?.name && (
          <p className="mt-6 text-sm font-medium text-slate-600">Hoi {demoContact.name}!</p>
        )}
        <h2 className={`${demoContact?.name ? "mt-2" : "mt-6"} text-3xl font-bold tracking-tight`}>
          Zo ziet <span className="text-(--accent)">jouw klant</span> het
        </h2>
        <p className="mt-2 text-sm text-slate-500">Probeer het zelf, het duurt een minuut.</p>

        <ol className="mx-auto mt-8 w-full max-w-sm space-y-2.5 text-left">
          {DEMO_STEPS.map((s, i) => (
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
          onClick={() => setStarted(true)}
          className={`mx-auto mt-8 block w-full max-w-sm rounded-full px-10 py-3.5 text-sm font-semibold text-white shadow-lg ${ACCENT_BG}`}
        >
          Start de demo
        </button>
        <p className="mt-3 text-xs text-slate-400">Werkt het best op je telefoon</p>
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
