"use client";

import { useId, useState } from "react";
import { CircleHelp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const SCAN_INFO_TEXT =
  "Eén inboedelscan is één complete woning, hoeveel kamers of foto's je klant ook maakt. Een scan telt pas als hij is afgerond en het volume is berekend. In je dashboard zie je altijd hoeveel scans je deze maand nog hebt.";

/**
 * Vraagteken achter "inboedelscans" met uitleg. Popover i.p.v. tooltip: werkt
 * ook met tikken op mobiel. Desktop: openen bij hover. Toetsenbord: Tab,
 * Enter/Spatie, Escape (Radix). Max. ±280px breed en binnen het scherm.
 */
export function ScanInfo({ extra }: { extra?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  // Hover alleen met een muis; op touch opent/sluit tikken (onOpenChange).
  const hover = (next: boolean) => (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") setOpen(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Wat is een inboedelscan?"
          aria-describedby={open ? id : undefined}
          onPointerEnter={hover(true)}
          onPointerLeave={hover(false)}
          className="ml-1 inline-flex size-5 translate-y-0.5 items-center justify-center rounded-full align-baseline text-muted-foreground transition hover:text-primary focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <CircleHelp className="size-4" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        id={id}
        role="tooltip"
        side="top"
        collisionPadding={16}
        onPointerEnter={hover(true)}
        onPointerLeave={hover(false)}
        // Focus op de knop laten; de tekst is alleen uitleg.
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-[min(280px,calc(100vw-2rem))] text-sm leading-relaxed text-popover-foreground"
      >
        {SCAN_INFO_TEXT}
        {extra && <p className="mt-2 font-medium">{extra}</p>}
      </PopoverContent>
    </Popover>
  );
}
