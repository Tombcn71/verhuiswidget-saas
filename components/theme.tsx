"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Pagina's die altijd licht blijven: wat de klanten van een verhuizer zien
 * (widget, demo-widget, boekingspagina) hoort bij de huisstijl van de verhuizer.
 */
const LIGHT_ONLY = /^\/(widget|demo|boeken)(\/|$)/;

/**
 * Elk bezoek begint zoals het systeem staat (licht/donker); er wordt niets
 * onthouden. Draait vóór de eerste weergave, dus geen flits.
 */
export const THEME_SCRIPT = `try{if(!${LIGHT_ONLY}.test(location.pathname)&&matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.classList.add("dark")}catch(e){}`;

const EVENT = "moverai-theme-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

const isDarkNow = () => document.documentElement.classList.contains("dark");

/** Gewone schakelaar: maan in licht (klik → donker), zon in donker (klik → licht). */
export function ThemeToggle({ className }: { className?: string }) {
  // Server: licht; daarna de echte stand (geen hydratie-verschil in het icoon).
  const isDark = useSyncExternalStore(subscribe, isDarkNow, () => false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      title={isDark ? "Lichte modus" : "Donkere modus"}
      aria-label={isDark ? "Schakel naar lichte modus" : "Schakel naar donkere modus"}
      onClick={() => {
        document.documentElement.classList.toggle("dark", !isDark);
        window.dispatchEvent(new Event(EVENT));
      }}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
