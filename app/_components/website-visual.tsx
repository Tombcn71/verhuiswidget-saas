"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Camera, ImageIcon, MousePointer2, Sparkles, Truck, X } from "lucide-react";
import moversPhoto from "@/public/onsite-verhuizers.jpg";

// Tijdlijn in stappen van 100 ms: pijl verschijnt, gaat naar de knop, klikt,
// het venster staat open, sluit weer.
const T_MOVE = 10;
const T_CLICK = 20;
const T_OPEN = 22;
const T_CLOSE = 75;
const T_END = 90;

/**
 * Onsite-kop: de website van een verhuizer. Een muispijl klikt op "Offerte in 1
 * minuut" en het venster opent over de site. Speelt alleen als hij in beeld is;
 * zonder animatie (reduced motion) staat het venster meteen open.
 */
export function WebsiteVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let id: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setT(T_OPEN);
        return;
      }
      if (e.isIntersecting && !id) id = setInterval(() => setT((x) => (x + 1) % T_END), 100);
      if (!e.isIntersecting && id) {
        clearInterval(id);
        id = undefined;
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      if (id) clearInterval(id);
    };
  }, []);

  const atButton = t >= T_MOVE && t < T_CLOSE;
  const clicking = t >= T_CLICK && t < T_OPEN + 1;
  const open = t >= T_OPEN && t < T_CLOSE;
  const pointerVisible = t >= 3 && t < T_CLOSE;

  return (
    <div ref={ref} className="overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
      <div className="flex items-center gap-1.5 border-b border-border bg-muted px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-red-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 rounded-md bg-background px-3 py-0.5 text-xs text-muted-foreground">
          jouwverhuisbedrijf.nl
        </span>
      </div>
      {/* Menubalk van de verhuizerssite */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 text-slate-900">
        <span className="flex items-center gap-1.5 text-sm font-bold">
          <Truck className="size-4 text-emerald-600" /> Jouw Verhuisbedrijf
        </span>
        <span className="hidden gap-4 text-xs text-slate-600 sm:flex">
          <span>Verhuizen</span>
          <span>Opslag</span>
          <span>Contact</span>
        </span>
      </div>
      {/* Hero met foto en de knop "Offerte in 1 minuut" */}
      <div className="relative h-72 sm:h-80">
        <Image
          src={moversPhoto}
          alt="Twee verhuizers tillen een bank door een lege kamer."
          fill
          placeholder="blur"
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-slate-900/75 via-slate-900/40 to-transparent" />
        <div className="absolute top-14 left-5 max-w-[11rem] text-white sm:top-20 sm:max-w-[13rem]">
          <p className="text-lg leading-tight font-bold sm:text-xl">Verhuizen zonder zorgen</p>
          <p className="mt-1 text-xs text-white/80">Al 20 jaar jouw verhuizer in de regio.</p>
          <span className="relative mt-3 inline-block">
            <span
              className={`inline-block rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-semibold shadow transition ${
                clicking ? "scale-95 ring-4 ring-white/40" : ""
              }`}
            >
              Offerte in 1 minuut
            </span>
            {/* Muispijl: komt van rechtsonder naar de knop */}
            <MousePointer2
              aria-hidden="true"
              className={`absolute top-1/2 left-2/3 size-6 fill-white text-slate-900 drop-shadow transition-all duration-900 ease-out ${
                pointerVisible ? "opacity-100" : "opacity-0"
              }`}
              style={{ transform: atButton ? "translate(0, 0)" : "translate(170px, 110px)" }}
            />
          </span>
        </div>

        {/* De echte pop-up (embed.js) met het eerste scherm van de widget */}
        {open && (
          <div className="absolute inset-0 flex justify-center bg-slate-900/50 px-6 py-3 backdrop-blur-[4px] animate-in fade-in duration-300">
            <div className="relative flex h-full w-[13.5rem] flex-col rounded-2xl bg-white px-4 pt-3 pb-3 text-slate-900 shadow-2xl animate-in zoom-in-95 duration-300">
              <span className="absolute -top-2.5 -right-2.5 flex size-6 items-center justify-center rounded-full bg-slate-900 text-white shadow">
                <X className="size-3.5" />
              </span>
              <div className="flex items-center">
                <ArrowLeft className="size-4 rounded-full text-slate-700" />
                <span className="flex-1 pr-4 text-center text-[11px] font-bold">Jouw Verhuisbedrijf</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[9px] text-slate-500">
                Stap 1 van 5
                <span className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} className={`size-1.5 rounded-full ${i === 0 ? "bg-brand-600" : "bg-slate-200"}`} />
                  ))}
                </span>
              </div>
              <p className="mt-4 text-center text-base font-bold">
                <span className="text-brand-600">Scan</span> je ruimtes
              </p>
              <p className="mx-auto mt-1 max-w-[13rem] text-center text-[10px] leading-snug text-slate-500">
                Maak foto&apos;s terwijl je door je huis loopt, of kies bestaande foto&apos;s uit je gallerij.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  { Icon: Camera, label: "Camera" },
                  { Icon: ImageIcon, label: "Gallerij" },
                ].map((o) => (
                  <div key={o.label} className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 py-3">
                    <o.Icon className="size-5 text-slate-700" />
                    <span className="text-[11px] font-semibold">{o.label}</span>
                  </div>
                ))}
              </div>
              <span className="mt-auto flex items-center justify-center gap-1 rounded-full bg-brand-600 py-2 text-[11px] font-semibold text-white">
                <Sparkles className="size-3" /> Start AI-analyse
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
