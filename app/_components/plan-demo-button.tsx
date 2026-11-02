"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { cn } from "@/lib/utils";
import { CONTACT_EMAIL } from "@/lib/plans";

declare global {
  interface Window {
    Calendly?: { initPopupWidget: (opts: { url: string }) => void };
  }
}

/**
 * Laadt de Calendly-pop-up één keer per pagina en telt geplande afspraken in Vercel Analytics.
 * Laadt hij niet (adblocker, geen netwerk), dan opent de knop gewoon de Calendly-link.
 */
function loadCalendly() {
  if (document.getElementById("calendly-widget")) return;
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://assets.calendly.com/assets/external/widget.css";
  document.head.appendChild(css);
  const js = document.createElement("script");
  js.id = "calendly-widget";
  js.src = "https://assets.calendly.com/assets/external/widget.js";
  js.async = true;
  document.head.appendChild(js);
  window.addEventListener("message", (e) => {
    if (e.origin === "https://calendly.com" && e.data?.event === "calendly.event_scheduled") {
      track("Afspraak gepland");
    }
  });
}

/**
 * "Plan een adviesgesprek": opent de agenda (Calendly) als pop-up over de site, zodat de
 * bezoeker op de site blijft. Het doel van de site: een gesprek, niet zelf even rondklikken.
 */
export function PlanDemoButton({
  href,
  from,
  className,
  children = "Plan een adviesgesprek",
}: {
  href: string | null;
  /** Waar op de site, voor Vercel Analytics. */
  from: string;
  className?: string;
  children?: React.ReactNode;
}) {
  useEffect(() => {
    if (href) loadCalendly();
  }, [href]);

  return (
    <a
      href={href ?? `mailto:${CONTACT_EMAIL}?subject=Adviesgesprek%20moverAI`}
      target="_blank"
      rel="noopener"
      onClick={(e) => {
        track("Demo inplannen", { from });
        if (href && window.Calendly) {
          e.preventDefault();
          window.Calendly.initPopupWidget({ url: href });
          // Site erachter blurren (via de stijl zelf: de CSS-build laat backdrop-filter weg).
          const bg = document.querySelector<HTMLElement>(".calendly-close-overlay");
          if (bg) {
            bg.style.backgroundColor = "rgb(15 23 42 / 0.35)";
            bg.style.backdropFilter = "blur(8px)";
            bg.style.setProperty("-webkit-backdrop-filter", "blur(8px)");
          }
        }
      }}
      className={cn(
        "inline-block rounded-full bg-brand-600 px-6 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-brand-700",
        className,
      )}
    >
      {children}
    </a>
  );
}
