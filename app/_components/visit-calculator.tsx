"use client";

import { useEffect, useState } from "react";
import { Clock, Fuel, Wallet } from "lucide-react";

// Aannames, ook onder de rekenhulp vermeld.
const HOURS_PER_VISIT = 1.5;
const HOURLY_RATE = 45;
const KM_PER_VISIT = 10;
const FUEL_PER_KM = 0.25;
const WEEKS_PER_MONTH = 4.33;

const euro = (n: number) => `€${Math.round(n).toLocaleString("nl-NL")}`;

// Autoplay (reel): omhoog naar 5 (kleine verhuizers doen er niet meer), even stilstaan, terug.
const AUTOPLAY = [1, 2, 3, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 3, 2];

/**
 * "Wat kosten voorinspecties jou?": één schuifje, direct de kosten per maand.
 * Met `autoplay` beweegt het schuifje vanzelf (voor de reel). `compact` (presentatie): uren en
 * brandstof naast elkaar en de kosten breed eronder, zodat hij minder hoog is.
 */
export function VisitCalculator({ autoplay = false, compact = false }: { autoplay?: boolean; compact?: boolean }) {
  const [perWeek, setPerWeek] = useState(autoplay ? 1 : 5);

  useEffect(() => {
    if (!autoplay) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % AUTOPLAY.length;
      setPerWeek(AUTOPLAY[i]);
    }, 250);
    return () => clearInterval(id);
  }, [autoplay]);
  const visits = perWeek * WEEKS_PER_MONTH;
  const hours = visits * HOURS_PER_VISIT;
  const fuel = visits * KM_PER_VISIT * FUEL_PER_KM;
  const total = hours * HOURLY_RATE + fuel;

  return (
    <div className={`rounded-2xl border border-border bg-background shadow-sm ${compact ? "p-5" : "p-6 sm:p-8"}`}>
      <label htmlFor="bezoeken" className="flex items-baseline justify-between gap-4 font-semibold">
        Voorinspecties per week
        <span className="text-3xl font-bold text-brand-600 tabular-nums">{perWeek}</span>
      </label>
      <input
        id="bezoeken"
        type="range"
        min={1}
        max={25}
        value={perWeek}
        onChange={(e) => setPerWeek(Number(e.target.value))}
        className="mt-4 w-full accent-brand-600"
      />

      <div className={`mt-6 grid gap-3 ${compact ? "grid-cols-2" : "sm:grid-cols-3"}`}>
        {[
          { Icon: Clock, label: "Uren per maand", value: `${Math.round(hours)} uur` },
          { Icon: Fuel, label: "Brandstof per maand", value: euro(fuel) },
          { Icon: Wallet, label: "Kost je per maand", value: euro(total), strong: true },
        ].map((x) => (
          <div
            key={x.label}
            className={`rounded-xl p-4 ${x.strong ? "bg-brand-600 text-white" : "bg-muted"} ${compact && x.strong ? "col-span-2" : ""}`}
          >
            <x.Icon className={`size-5 ${x.strong ? "text-white" : "text-brand-600"}`} />
            <p className={`mt-2 text-sm ${x.strong ? "text-white/80" : "text-muted-foreground"}`}>{x.label}</p>
            <p className="text-2xl font-bold tabular-nums">{x.value}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        Per voorinspectie: {HOURS_PER_VISIT.toLocaleString("nl-NL")} uur à €{HOURLY_RATE} en {KM_PER_VISIT} km brandstof à €
        {FUEL_PER_KM.toLocaleString("nl-NL", { minimumFractionDigits: 2 })} per km. Ook bij klanten die niet boeken.
      </p>
    </div>
  );
}
