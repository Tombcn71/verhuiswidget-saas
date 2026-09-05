"use client";

import { useEffect, useRef, useState } from "react";
import { MoveFlow } from "./move-flow";
import { ClearanceFlow } from "./clearance-flow";

type CompanyPublic = {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  phone: string | null;
  serviceType: "verhuizen" | "ontruimen" | "beide";
};

const AI_GRADIENT = "bg-linear-to-br from-blue-600 via-indigo-600 to-violet-600";

export function Widget({
  company,
  demo = false,
}: {
  company: CompanyPublic;
  demo?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const accent = company.primaryColor;
  const fillClass = demo ? AI_GRADIENT : "";
  const fillStyle = demo ? undefined : { background: accent };

  const showToggle = company.serviceType === "beide";
  const forcedType: "verhuizing" | "ontruiming" | null =
    company.serviceType === "ontruimen"
      ? "ontruiming"
      : company.serviceType === "verhuizen"
        ? "verhuizing"
        : null;

  const [started, setStarted] = useState(!demo);
  const [moveType, setMoveType] = useState<"verhuizing" | "ontruiming">(
    forcedType ?? "verhuizing",
  );
  const [step, setStep] = useState(0);
  const [clearanceStep, setClearanceStep] = useState(0);

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
        className="flex h-full min-h-dvh flex-col bg-white px-5 py-8 text-center text-slate-900"
      >
        <h2 className="text-2xl font-bold tracking-tight">
          Verhuizen,{" "}
          <span className="bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            opnieuw uitgevonden
          </span>
          .
        </h2>

        <div className="mx-auto mt-6 w-full flex-1 overflow-hidden rounded-xl shadow-lg">
          <iframe
            className="h-full w-full"
            src="https://www.youtube.com/embed/eyoyGdp0Zpo?si=At4BHuvWhF0EIBfm"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>

        <button
          onClick={() => setStarted(true)}
          className={`mx-auto mt-6 block rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg ${fillClass}`}
          style={fillStyle}
        >
          Overslaan
        </button>
      </div>
    );
  }

  if (demo && moveType !== "ontruiming") {
    return (
      <div ref={rootRef} className="bg-white text-slate-900">
        <MoveFlow
          company={company}
          demo={demo}
          showToggle={showToggle}
          moveType={moveType}
          setMoveType={setMoveType}
          step={step}
          setStep={setStep}
          onBackToIntro={() => setStarted(false)}
        />
      </div>
    );
  }

  if (demo && moveType === "ontruiming") {
    return (
      <div ref={rootRef} className="bg-white text-slate-900">
        <ClearanceFlow
          company={company}
          demo={demo}
          showToggle={showToggle}
          moveType={moveType}
          setMoveType={setMoveType}
          step={clearanceStep}
          setStep={setClearanceStep}
        />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="mx-auto max-w-xl p-4 text-slate-900">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        {company.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logoUrl} alt={company.name} className="h-8 w-auto" />
        ) : (
          <span className="font-bold">{company.name}</span>
        )}
        <span className="text-sm text-slate-500">Offerte in 2 minuten</span>
      </div>

      {moveType === "ontruiming" ? (
        <ClearanceFlow
          company={company}
          demo={demo}
          showToggle={showToggle}
          moveType={moveType}
          setMoveType={setMoveType}
          step={clearanceStep}
          setStep={setClearanceStep}
        />
      ) : (
        <MoveFlow
          company={company}
          demo={demo}
          showToggle={showToggle}
          moveType={moveType}
          setMoveType={setMoveType}
          step={step}
          setStep={setStep}
        />
      )}

      <p className="mt-6 text-center text-[11px] text-slate-400">
        Mogelijk gemaakt door Move Ai
      </p>
    </div>
  );
}
