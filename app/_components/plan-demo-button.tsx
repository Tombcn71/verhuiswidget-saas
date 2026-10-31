"use client";

import { track } from "@vercel/analytics";
import { cn } from "@/lib/utils";
import { CONTACT_EMAIL } from "@/lib/plans";

/**
 * "Plan een demo": opent de agenda (Calendly) voor een demogesprek van 5 minuten.
 * Het doel van de site: een gesprek, niet zelf even rondklikken.
 */
export function PlanDemoButton({
  href,
  from,
  className,
  children = "Plan een demo",
}: {
  href: string | null;
  /** Waar op de site, voor Vercel Analytics. */
  from: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href ?? `mailto:${CONTACT_EMAIL}?subject=Demo%20moverAI`}
      target="_blank"
      rel="noopener"
      onClick={() => track("Demo inplannen", { from })}
      className={cn(
        "inline-block rounded-full bg-brand-600 px-6 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-brand-700",
        className,
      )}
    >
      {children}
    </a>
  );
}
