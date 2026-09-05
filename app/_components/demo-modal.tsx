"use client";

import { useEffect, useState } from "react";
import { Widget } from "@/app/widget/[companyId]/widget";
import { DEMO_COMPANY_PUBLIC } from "@/lib/demo";

export function DemoModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
      >
        Probeer de demo
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/40 sm:backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Demo van moverAI"
        >
          <div
            className="relative w-full sm:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Sluiten"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-white shadow-lg hover:bg-slate-900"
            >
              ×
            </button>
            {/* Altijd van boven tot onder (mobiel én desktop) — de demo-video is voor mobiel gemaakt. */}
            <div className="h-dvh w-full overflow-y-auto bg-white sm:shadow-xl">
              <Widget company={DEMO_COMPANY_PUBLIC} demo />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
