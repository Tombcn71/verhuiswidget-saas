"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { track } from "@vercel/analytics";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heroImage from "@/public/hero.jpg";
import tomImage from "@/public/tom.jpg";
import { Logo } from "@/app/_components/logo";
import { HeroTimer } from "@/app/_components/hero-timer";
import { LinkVisual } from "@/app/_components/link-visual";
import { WebsiteVisual } from "@/app/_components/website-visual";
import { SpotVisual } from "@/app/_components/spot-visual";
import { VisitCalculator } from "@/app/_components/visit-calculator";
import { PlanDemoButton, warmCalendly } from "@/app/_components/plan-demo-button";

// `fill`: de visual krijgt de hele ruimte (de laatste dia: foto in het midden, knop onderin).
type Slide = { fill?: boolean; title: React.ReactNode; text?: string; visual: React.ReactNode };

const B = "text-primary";

function slides(calendlyUrl: string | null): Slide[] {
  return [
    {
      title: (
        <>
          Offerte in 1 minuut. <span className={B}>Zonder huisbezoek.</span>
        </>
      ),
      text: "Je klant scant zijn inboedel en krijgt direct jouw offerte.",
      visual: (
        <div className="relative mx-auto aspect-4/5 w-full overflow-hidden rounded-2xl shadow-xl ring-1 ring-border">
          <Image src={heroImage} alt="" fill priority sizes="28rem" className="object-cover object-[25%_50%]" />
          <HeroTimer />
        </div>
      ),
    },
    {
      title: (
        <>
          Wat kosten huisbezoeken <span className={B}>jou</span>?
        </>
      ),
      text: "Schuif naar je bezoeken per week.",
      visual: <VisitCalculator compact />,
    },
    {
      title: (
        <>
          Aanvraag via een offerteplatform? <span className={B}>Als eerste met een offerte.</span>
        </>
      ),
      text: "Stuur je klant met één klik je linkje.",
      visual: <LinkVisual />,
    },
    {
      title: (
        <>
          Je website haalt aanvragen binnen. <span className={B}>Ook &apos;s avonds.</span>
        </>
      ),
      text: "Een knop op je eigen site, in jouw huisstijl.",
      visual: <WebsiteVisual />,
    },
    {
      title: (
        <>
          Zelf bij de klant? <span className={B}>Scan ter plekke.</span>
        </>
      ),
      text: "Scan de kamers en verstuur de offerte ter plekke.",
      visual: <SpotVisual />,
    },
    {
      title: (
        <>
          Benieuwd hoe het voor <span className={B}>jouw bedrijf</span> werkt?
        </>
      ),
      fill: true,
      visual: (
        <div className="flex h-full flex-col text-center">
          <div className="my-auto">
            <Image src={tomImage} alt="Tom, oprichter van moverAI" className="mx-auto size-28 rounded-full object-cover shadow-lg" />
            <p className="mx-auto mt-4 max-w-xs text-lg text-muted-foreground">
              Hallo 👋 ik ben Tom,
              <br />
              in 15 minuten loop ik
              <br />
              alles met je door.
            </p>
          </div>
          <div>
            <PlanDemoButton href={calendlyUrl} from="presentatie" className="px-8 py-4 text-lg" />
            <p className="mt-3 text-sm text-muted-foreground">15 minuten · vrijblijvend</p>
          </div>
        </div>
      ),
    },
  ];
}

/**
 * Verkleint de inhoud zodat hij in de beschikbare hoogte past; zo hoeft er op geen enkele
 * telefoon gescrold te worden.
 */
function Fit({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const o = outer.current;
    const n = inner.current;
    if (!o || !n) return;
    const update = () => setScale(Math.min(1, o.clientHeight / n.offsetHeight));
    const ro = new ResizeObserver(update);
    ro.observe(o);
    ro.observe(n);
    update();
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outer} className="flex h-full items-center justify-center">
      <div ref={inner} className="w-full shrink-0" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Presentatie om via WhatsApp te sturen: één dia tegelijk, vegen of tikken op de
 * pijltjes (of pijltjestoetsen). De animaties beginnen opnieuw bij elke dia.
 */
export function Slides({ calendlyUrl }: { calendlyUrl: string | null }) {
  const all = slides(calendlyUrl);
  const [i, setI] = useState(0);
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => {
      const n = Math.max(0, Math.min(all.length - 1, next));
      setI(n);
      track("Presentatie dia", { dia: n + 1 });
    },
    [all.length],
  );

  // De agenda op de laatste dia alvast laden, zodat hij meteen opent.
  useEffect(() => warmCalendly(calendlyUrl), [calendlyUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go]);

  const s = all[i];
  return (
    <div
      className="flex h-dvh flex-col overflow-hidden bg-white text-foreground"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? i + 1 : i - 1);
        touchX.current = null;
      }}
    >
      <header className="flex shrink-0 justify-center pt-4">
        <Logo className="text-lg" />
      </header>

      <main
        key={i}
        className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-6 pt-5 animate-in fade-in duration-300"
      >
        <h1 className="text-center text-balance text-2xl leading-tight font-bold tracking-tight">{s.title}</h1>
        {s.text && <p className="mt-2 text-center text-balance text-muted-foreground">{s.text}</p>}
        <div className="min-h-0 flex-1 py-5 text-left">{s.fill ? s.visual : <Fit>{s.visual}</Fit>}</div>
      </main>

      <footer className="mx-auto flex w-full max-w-md shrink-0 items-center justify-between px-6 pb-5">
        <button
          type="button"
          onClick={() => go(i - 1)}
          disabled={i === 0}
          className="flex size-12 items-center justify-center rounded-full border bg-white disabled:invisible"
          aria-label="Vorige"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex gap-1.5">
          {all.map((_, n) => (
            <button
              key={n}
              type="button"
              aria-label={`Dia ${n + 1}`}
              onClick={() => go(n)}
              className={`h-2 rounded-full transition-all ${n === i ? "w-6 bg-primary" : "w-2 bg-slate-200"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(i + 1)}
          disabled={i === all.length - 1}
          className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:invisible"
          aria-label="Volgende"
        >
          <ChevronRight className="size-5" />
        </button>
      </footer>
    </div>
  );
}
