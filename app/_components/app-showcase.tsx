"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, Link, MapPin, Smartphone, Truck, Users } from "lucide-react";

const POINTS = [
  { Icon: Smartphone, text: "Een web app op je beginscherm, met één tik open. Geen app store nodig." },
  { Icon: Link, text: "Onlink: aanvraag binnen? Stuur met één tik je linkje via WhatsApp of mail." },
  { Icon: MapPin, text: "Onspot: bij de klant de kamers scannen en de offerte ter plekke versturen." },
  { Icon: Users, text: "Alle aanvragen van je team in één dashboard, op je telefoon of computer." },
];

const KNOPPEN = [
  { Icon: Link, manier: "Onlink", titel: "Reageer op aanvraag", tekst: "Stuur je linkje via WhatsApp of mail." },
  { Icon: MapPin, manier: "Onspot", titel: "Nieuwe scan", tekst: "Bij de klant: scan de kamers, verstuur de offerte." },
];

/**
 * "Je eigen web app": een telefoon met moverAI op het beginscherm (Onlink en Onspot).
 * De twee keuzes lichten om en om op; zonder animatie (reduced motion) staat alles stil.
 */
export function AppShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const [actief, setActief] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let id: ReturnType<typeof setInterval> | undefined;
    let tel = 0;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !id) {
        id = setInterval(() => {
          tel = (tel + 1) % 4; // 0 = Onlink, 1 = rust, 2 = Onspot, 3 = rust
          setActief(tel === 0 ? 0 : tel === 2 ? 1 : null);
        }, 1400);
      }
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

  return (
    <section id="webapp" className="scroll-mt-20 py-20">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
            <Smartphone className="size-3.5" />
            Web app
          </p>
          <h2 className="text-3xl font-bold tracking-tight">
            Je eigen <span className="text-primary">web app</span> op je telefoon
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Eén tik op je beginscherm en je kiest: reageren op een aanvraag, of bij de klant scannen.
          </p>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="inline-flex shrink-0 rounded-lg bg-brand-600 p-2 text-white">
                  <Icon className="size-4" />
                </span>
                <span className="pt-1 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div ref={ref}>
          <div className="relative mx-auto aspect-9/16 w-full max-w-[17rem] overflow-hidden rounded-[2.75rem] border-[10px] border-slate-900 bg-white text-slate-900 shadow-xl dark:border-slate-700">
            {/* Camera-eiland */}
            <span className="absolute top-2 left-1/2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900 dark:bg-slate-700" />
            <div className="flex h-full flex-col px-4 pt-10 pb-4">
              <p className="flex items-center justify-center gap-1.5 text-sm font-bold">
                <Truck className="size-4 text-brand-600" /> Jouw Verhuisbedrijf
              </p>
              <div className="my-auto space-y-3">
                {KNOPPEN.map((k, i) => (
                  <div
                    key={k.titel}
                    className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-3 py-4 text-center transition duration-300 ${
                      actief === i ? "scale-[0.97] border-brand-600 bg-brand-50" : "border-slate-200"
                    }`}
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                      <k.Icon className="size-5" />
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {k.manier}
                    </span>
                    <span className="text-sm font-bold">{k.titel}</span>
                    <span className="text-[10px] text-slate-500">{k.tekst}</span>
                  </div>
                ))}
              </div>
              <p className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
                <LayoutDashboard className="size-3.5" /> Naar dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
