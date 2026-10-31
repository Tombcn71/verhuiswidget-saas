"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Camera, Check, ImageIcon, Loader2, Minus, Plus, Send, Sparkles } from "lucide-react";
import woonkamer from "@/public/voorbeeldwoningen/appartement/woonkamer.jpg";
import slaapkamer from "@/public/voorbeeldwoningen/appartement/slaapkamer.jpg";
import keuken from "@/public/voorbeeldwoningen/appartement/keuken.jpg";

// Tijdlijn in stappen van 100 ms (ca. 14 s): startscherm, camera, analyse,
// "Check de inboedel" (labels en + tikken), offerte versturen.
const T_CAMERA = 20;
const T_PHOTO_DONE = 40;
const T_CHECK = 60;
const T_OFFER = 100;
const T_END = 140;

/** Blauwe labels op de foto, zoals de app ze na de analyse toont (positie in %). */
const LABELS = [
  { name: "Bank", x: 22, y: 62 },
  { name: "Salontafel", x: 50, y: 74 },
  { name: "Eettafel", x: 80, y: 52 },
  { name: "Boekenkast", x: 78, y: 22 },
];
const ITEMS = [
  { name: "Bank", qty: 1 },
  { name: "Stoel", qty: 4 },
  { name: "Eettafel", qty: 1 },
];
// Het hele appartement is gescand: de offerte geldt voor alle ruimtes samen.
const ROOMS = [
  { label: "Woonkamer", photo: woonkamer, photos: 3, items: 7 },
  { label: "Slaapkamer", photo: slaapkamer, photos: 2, items: 9 },
  { label: "Keuken", photo: keuken, photos: 2, items: 6 },
];

/** Waar de vinger tikt (in % van het scherm) en wanneer. */
const TAPS = [
  { at: 13, left: "27%", top: "42%" }, // Camera
  { at: 30, left: "50%", top: "88%" }, // sluiterknop
  { at: 50, left: "50%", top: "91%" }, // Start AI-analyse
  { at: 82, left: "86%", top: "58%" }, // + bij Stoel
  { at: 95, left: "50%", top: "91%" }, // Volgende
  { at: 120, left: "50%", top: "91%" }, // Offerte versturen
];

/**
 * Onspot-kop: een telefoon met de schermen van de app. Een vinger tikt op Camera,
 * maakt een foto, start de AI-analyse, checkt de inboedel (blauwe labels op de
 * foto, + en −) en verstuurt de offerte. Speelt alleen in beeld; zonder animatie
 * (reduced motion) staat de inboedel er meteen.
 */
export function SpotVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let id: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setT(T_CHECK + 20);
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

  const screen = t < T_CAMERA ? 0 : t < T_PHOTO_DONE ? 1 : t < T_CHECK ? 2 : t < T_OFFER ? 3 : 4;
  const tap = TAPS.find((x) => t <= x.at + 3) ?? TAPS[TAPS.length - 1];
  const tapping = t >= tap.at && t <= tap.at + 3;
  const fingerVisible = t <= tap.at + 6;
  const flash = t >= 31 && t <= 32;
  const analysing = t >= 52 && t < T_CHECK;
  const labelsShown = Math.min(LABELS.length, Math.max(0, Math.floor((t - T_CHECK) / 3) + 1));
  const plusDone = t >= 83;
  const sent = t >= 123;

  return (
    <div
      ref={ref}
      className="relative mx-auto aspect-9/16 w-full max-w-[17rem] overflow-hidden rounded-[2.75rem] border-[10px] border-slate-900 bg-white text-slate-900 shadow-xl dark:border-slate-700"
    >
      {/* Camera-eiland */}
      <span className="absolute top-2 left-1/2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900 dark:bg-slate-700" />

      {(screen === 0 || screen === 2) && (
        <div className="flex h-full flex-col px-4 pt-9 pb-5">
          <Header />
          <p className="mt-6 text-center text-lg font-bold">
            <span className="text-brand-600">Scan</span> je ruimtes
          </p>
          <p className="mt-1 text-center text-[11px] leading-snug text-slate-500">
            Maak foto&apos;s terwijl je door het huis loopt, of kies bestaande foto&apos;s.
          </p>
          {screen === 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-2">
              {[
                { Icon: Camera, label: "Camera" },
                { Icon: ImageIcon, label: "Gallerij" },
              ].map((o, i) => (
                <div
                  key={o.label}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border py-4 transition ${
                    i === 0 && t >= 13 ? "border-brand-600 bg-brand-50" : "border-slate-200"
                  }`}
                >
                  <o.Icon className="size-6 text-slate-700" />
                  <span className="text-xs font-semibold">{o.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <ul className="mt-4 space-y-1.5">
              {ROOMS.map((r) => (
                <li key={r.label} className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-1.5">
                  <Image src={r.photo} alt="" width={36} height={36} className="size-9 rounded-lg object-cover" />
                  <span className="flex-1 text-xs">
                    <span className="block font-semibold">{r.label}</span>
                    <span className="text-slate-500">{r.photos} foto&apos;s</span>
                  </span>
                  <Check className="size-4 text-emerald-600" />
                </li>
              ))}
            </ul>
          )}
          <span
            className={`mt-auto flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold text-white ${
              screen === 0 ? "bg-brand-600/40" : "bg-brand-600"
            }`}
          >
            {analysing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Bezig…
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" /> Start AI-analyse
              </>
            )}
          </span>
        </div>
      )}

      {screen === 1 && (
        <div className="relative h-full bg-black">
          <Image src={woonkamer} alt="" fill sizes="17rem" className="object-cover opacity-90" />
          {t >= 32 && (
            <span className="absolute right-4 bottom-7 flex size-9 items-center justify-center rounded-lg border-2 border-white bg-black/40 text-xs font-bold text-white">
              {t >= 36 ? 3 : 1}
            </span>
          )}
          <span className="absolute bottom-5 left-1/2 size-14 -translate-x-1/2 rounded-full border-4 border-white bg-white/30" />
          {flash && <span className="absolute inset-0 bg-white" />}
        </div>
      )}

      {screen === 3 && (
        <div className="flex h-full flex-col px-3 pt-9 pb-4">
          <p className="text-center text-base font-bold">
            Check de <span className="text-brand-600">inboedel</span>
          </p>
          <p className="mt-1 rounded-lg border border-slate-200 py-1 text-center text-[10px]">
            Totaal volume: <strong>{plusDone ? "24,2" : "23,7"} m³</strong>
            <span className="block text-[9px] text-slate-500">Alleen zichtbaar voor jou</span>
          </p>
          <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 px-2.5 py-1.5">
              <Image src={woonkamer} alt="" width={24} height={24} className="size-6 rounded-full object-cover" />
              <span className="text-[11px]">
                <span className="font-semibold">Woonkamer</span>
                <span className="text-slate-500"> · 3 foto&apos;s · {plusDone ? 8 : 7} items</span>
              </span>
            </div>
            <div className="relative h-20 bg-slate-100">
              <Image src={woonkamer} alt="" fill sizes="17rem" className="object-cover object-[center_60%]" />
              {LABELS.slice(0, labelsShown).map((l) => (
                <span
                  key={l.name}
                  className="absolute -translate-x-1/2 -translate-y-full rounded-full bg-brand-600 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow animate-in fade-in zoom-in-75"
                  style={{ left: `${l.x}%`, top: `${l.y}%` }}
                >
                  {l.name}
                </span>
              ))}
            </div>
            <ul className="space-y-1 px-2.5 py-2">
              {ITEMS.map((it) => {
                const qty = it.name === "Stoel" && plusDone ? it.qty + 1 : it.qty;
                return (
                  <li key={it.name} className="flex items-center justify-between text-[11px]">
                    {it.name}
                    <span className="flex items-center gap-1.5">
                      <span className="flex size-5 items-center justify-center rounded-full border border-slate-300">
                        <Minus className="size-2.5" />
                      </span>
                      <span className="w-3 text-center font-semibold">{qty}</span>
                      <span className="flex size-5 items-center justify-center rounded-full border border-slate-300">
                        <Plus className="size-2.5" />
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          {ROOMS.slice(1).map((r) => (
            <div key={r.label} className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px]">
              <Image src={r.photo} alt="" width={24} height={24} className="size-6 rounded-full object-cover" />
              <span className="font-semibold">{r.label}</span>
              <span className="text-slate-500">
                · {r.photos} foto&apos;s · {r.items} items
              </span>
            </div>
          ))}
          <span className="mt-auto flex items-center justify-center rounded-full bg-brand-600 py-2.5 text-xs font-semibold text-white">
            Volgende
          </span>
        </div>
      )}

      {screen === 4 && (
        <div className="flex h-full flex-col px-4 pt-9 pb-5 animate-in fade-in">
          <Header />
          <p className="mt-5 text-center text-xs text-slate-500">Je offerte</p>
          <p className="text-center text-4xl font-bold tracking-tight">€ 830</p>
          <ul className="mt-4 space-y-1.5 text-xs">
            {[
              ["Woning", "3 ruimtes"],
              ["Volume", "24,2 m³"],
              ["Ploeg", "3 verhuizers"],
              ["Duur", "5 uur"],
            ].map(([k, v]) => (
              <li key={k} className="flex justify-between rounded-lg bg-slate-50 px-3 py-1.5">
                <span className="text-slate-500">{k}</span>
                <span className="font-semibold">{v}</span>
              </li>
            ))}
          </ul>
          <span
            className={`mt-auto flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold text-white transition ${
              sent ? "bg-emerald-600" : "bg-brand-600"
            }`}
          >
            {sent ? (
              <>
                <Check className="size-3.5" /> Offerte verstuurd
              </>
            ) : (
              <>
                <Send className="size-3.5" /> Offerte versturen
              </>
            )}
          </span>
        </div>
      )}

      {/* Vinger */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute z-10 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900/30 shadow-lg transition-all duration-700 ease-in-out ${
          fingerVisible ? "opacity-100" : "opacity-0"
        } ${tapping ? "scale-75 bg-slate-900/50" : "scale-100"}`}
        style={{ left: tap.left, top: tap.top }}
      />
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center">
      <ArrowLeft className="size-4 text-slate-700" />
      <span className="flex-1 pr-4 text-center text-xs font-bold">Jouw Verhuisbedrijf</span>
    </div>
  );
}
