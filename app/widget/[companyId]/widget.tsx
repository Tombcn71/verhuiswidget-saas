"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "@/app/_components/icons";
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

      {demo && !started ? (
        <div className="py-6 text-center">
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white ${fillClass}`}
            style={fillStyle}
          >
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-xl font-bold tracking-tight">
            Direct een prijsindicatie met onze slimme{" "}
            <span className="bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              AI tool
            </span>
            .
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-sm italic text-slate-500">
            Even een paar vragen beantwoorden en wat foto&apos;s uploaden dat is alles
          </p>
          <button
            onClick={() => setStarted(true)}
            className={`mt-6 w-full rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-md ${fillClass}`}
            style={fillStyle}
          >
            Start de demo
          </button>
        </div>
      ) : moveType === "ontruiming" ? (
        <ClearanceFlow
          company={company}
          demo={demo}
          onBack={showToggle ? () => setMoveType("verhuizing") : undefined}
        />
      ) : (
        <MoveFlow
          company={company}
          demo={demo}
          showToggle={showToggle}
          moveType={moveType}
          setMoveType={setMoveType}
        />
      )}

      <p className="mt-6 text-center text-[11px] text-slate-400">
        Mogelijk gemaakt door Move Ai
      </p>
    </div>
  );
}
