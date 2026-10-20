"use client";

import { useEffect, useRef, useState } from "react";
import type { LeadSource } from "@/lib/leads";
import { MoveFlow } from "./move-flow";

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
  { icon: "📸", text: "Maak foto's van 1 of 2 kamers" },
  { icon: "🤖", text: "De AI herkent de meubels en berekent de m³" },
  { icon: "💶", text: "Je ziet direct de prijs, met voorbeeldtarieven" },
];

export function Widget({
  company,
  demo = false,
  preview = false,
  source = "onsite",
  backUrl = null,
}: {
  company: CompanyPublic;
  demo?: boolean;
  preview?: boolean;
  source?: LeadSource;
  /** Website van de verhuizer, alleen op de losse pagina (Onlink). */
  backUrl?: string | null;
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
        className="flex h-full min-h-dvh flex-col justify-center bg-white px-6 py-10 text-center text-slate-900"
      >
        <h2 className="text-3xl font-bold tracking-tight">
          Zo ziet{" "}
          <span className="text-(--accent)">
            jouw klant
          </span>{" "}
          het
        </h2>
        <p className="mt-2 text-sm text-slate-500">Probeer het zelf in een minuut:</p>

        <ul className="mx-auto mt-8 w-full max-w-xs space-y-3 text-left">
          {DEMO_STEPS.map((s) => (
            <li
              key={s.text}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            >
              <span aria-hidden="true" className="text-2xl">
                {s.icon}
              </span>
              <span>{s.text}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => setStarted(true)}
          className={`mx-auto mt-10 block rounded-full px-10 py-3.5 text-sm font-semibold text-white shadow-lg ${ACCENT_BG}`}
        >
          Start de demo
        </button>
        <p className="mt-3 text-xs text-slate-400">Tip: werkt het best op je telefoon</p>
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
