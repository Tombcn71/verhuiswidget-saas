"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { LogoMark } from "./logo";

const DONE_AT = 52; // seconden: "klaar in 0:52"

/**
 * Badge op de hero-foto: een klok loopt van 0:00 naar 0:52 en dan staat de
 * offerte klaar. Herhaalt zich; zonder animatie (reduced motion) meteen klaar.
 */
export function HeroTimer() {
  const [sec, setSec] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => setSec(DONE_AT), 0);
      return () => clearTimeout(t);
    }
    // Ca. 2,5 s optellen, 4 s "klaar" laten staan, dan opnieuw.
    let s = 0;
    const id = setInterval(() => {
      s = s >= DONE_AT + 80 ? 0 : s + 1;
      setSec(Math.min(s, DONE_AT));
    }, 50);
    return () => clearInterval(id);
  }, []);

  const done = sec >= DONE_AT;
  return (
    <div className="absolute top-4 left-4 flex items-center gap-2.5 rounded-xl bg-white/95 px-3.5 py-2.5 text-sm text-slate-900 shadow-lg ring-1 ring-black/5">
      <span
        className={`flex size-8 items-center justify-center rounded-full ${done ? "bg-emerald-600" : "bg-brand-600"} text-white`}
      >
        {done ? <Check className="size-4" /> : <LogoMark className="size-4.5" />}
      </span>
      <span>
        <span className="block text-xs text-slate-500">{done ? "Offerte klaar in" : "AI maakt offerte…"}</span>
        <span className="block font-mono text-base font-bold tabular-nums">
          0:{String(sec).padStart(2, "0")}
        </span>
      </span>
    </div>
  );
}
