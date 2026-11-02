"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { cn } from "@/lib/utils";
import { CONTACT_EMAIL } from "@/lib/plans";

/**
 * Calendly in een eigen pop-up over de site (site erachter geblurd). De agenda wordt één keer
 * onzichtbaar geladen zodra de pagina rustig is; bij de klik tonen we precies dat venster, zodat
 * hij meteen open staat in plaats van na seconden laden.
 */
// Verborgen met opacity in plaats van visibility/display: dan pauzeert de browser het laden niet.
let modal: HTMLDivElement | null = null;

function buildModal(href: string) {
  if (modal) return modal;
  const url = new URL(href);
  url.searchParams.set("embed_domain", location.host);
  url.searchParams.set("embed_type", "Inline");
  url.searchParams.set("hide_gdpr_banner", "1"); // geen cookiemelding van Calendly

  const m = document.createElement("div");
  m.style.cssText =
    "position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;" +
    "background:rgb(15 23 42 / .35);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);" +
    "opacity:0;pointer-events:none;transition:opacity .2s";
  const box = document.createElement("div");
  box.style.cssText =
    "position:relative;width:100%;height:100%;max-width:1000px;max-height:min(720px,100dvh);" +
    "background:#fff;overflow:hidden;border-radius:" +
    (innerWidth >= 640 ? "16px" : "0");
  const frame = document.createElement("iframe");
  frame.src = url.toString();
  frame.title = "Plan een adviesgesprek";
  frame.style.cssText = "width:100%;height:100%;border:0";
  const close = document.createElement("button");
  close.type = "button";
  close.setAttribute("aria-label", "Sluiten");
  close.textContent = "×";
  close.style.cssText =
    "position:absolute;top:8px;left:8px;width:40px;height:40px;border-radius:9999px;border:0;" +
    "background:rgb(15 23 42 / .75);color:#fff;font-size:26px;line-height:1;cursor:pointer";

  const hide = () => {
    m.style.opacity = "0";
    m.style.pointerEvents = "none";
    document.body.style.overflow = "";
  };
  close.onclick = hide;
  m.onclick = (e) => {
    if (e.target === m) hide();
  };
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide();
  });
  addEventListener("message", (e) => {
    if (e.origin === "https://calendly.com" && e.data?.event === "calendly.event_scheduled") {
      track("Afspraak gepland");
    }
  });

  box.append(frame, close);
  m.append(box);
  document.body.append(m);
  modal = m;
  return m;
}

function openModal(href: string) {
  const m = buildModal(href);
  m.style.pointerEvents = "auto";
  m.style.opacity = "1";
  document.body.style.overflow = "hidden";
}

/** Laadt de agenda alvast onzichtbaar zodra de pagina rustig is (ook vanuit de presentatie). */
export function warmCalendly(href: string | null) {
  if (!href) return;
  const warm = () => setTimeout(() => buildModal(href), 1500);
  if (document.readyState === "complete") warm();
  else addEventListener("load", warm, { once: true });
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
  useEffect(() => warmCalendly(href), [href]);

  return (
    <a
      href={href ?? `mailto:${CONTACT_EMAIL}?subject=Adviesgesprek%20moverAI`}
      target="_blank"
      rel="noopener"
      onClick={(e) => {
        track("Demo inplannen", { from });
        if (href) {
          e.preventDefault();
          openModal(href);
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
