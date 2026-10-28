"use client";

import { useEffect, useRef, useState } from "react";
import { BellRing, Check, Copy, House, Mail, MessageCircle, Zap } from "lucide-react";

const EMAIL = "sanne@gmail.com";
const LINK = "moverai.nl/offerte/jouw-bedrijf";

const POINTS = [
  { Icon: Zap, text: "Als eerste een echte prijs, nog voordat je concurrent terugbelt." },
  { Icon: House, text: "Geen bezoek aan huis nodig." },
  { Icon: BellRing, text: "Boekt de klant niet meteen? Na 2 dagen krijgt hij vanzelf een herinnering." },
];

/** Op mobiel: label met pijltje vlak boven het onderdeel (de grote pijlen passen daar niet). */
function MobileNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 mb-1.5 flex items-end gap-1 text-xs font-semibold text-brand-700 lg:hidden">
      <svg
        viewBox="0 0 30 30"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-6 shrink-0 text-brand-600"
      >
        {/* Ronde boog, punt naar beneden */}
        <path d="M5 6 C 16 4, 24 12, 20 25" />
        <path d="M20 25 L 16 20.5 M20 25 L 24.5 21" />
      </svg>
      {children}
    </p>
  );
}

/**
 * Op een groot scherm: notitie naast het onderdeel, met een gebogen pijl ernaartoe.
 * In een `relative` wrapper rond dat onderdeel.
 */
function SideNote({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  return (
    <span
      className={`absolute top-1/2 hidden w-44 -translate-y-1/2 items-center gap-1.5 text-sm leading-snug font-semibold text-brand-700 lg:flex ${
        side === "right" ? "left-full ml-7" : "right-full mr-7 flex-row-reverse text-right"
      }`}
    >
      <svg
        viewBox="0 0 56 36"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`h-9 w-14 shrink-0 text-brand-600 ${side === "left" ? "-scale-x-100" : ""}`}
      >
        {/* Speelse krul met een lusje, punt links */}
        <path d="M54 30 C 44 34, 30 32, 32 22 C 34 13, 44 17, 40 24 C 36 31, 18 30, 6 14" />
        <path d="M6 14 C 6 18, 6 21, 7 24 M6 14 C 9 15, 12 16, 15 16" />
      </svg>
      {children}
    </span>
  );
}

/**
 * "Win meer op offerteplatforms": het blok Snelle acties uit het dashboard,
 * nagebouwd, met een e-mailadres dat zichzelf intikt en verstuurd wordt.
 */
export function PlatformShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState("");
  const [sent, setSent] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const run = () => {
      setTyped("");
      setSent(false);
      [...EMAIL].forEach((_, i) => at(600 + i * 90, () => setTyped(EMAIL.slice(0, i + 1))));
      const done = 600 + EMAIL.length * 90 + 400;
      at(done, () => setPressed(true));
      at(done + 200, () => {
        setPressed(false);
        setSent(true);
      });
      at(done + 3600, run);
    };
    // Pas starten als het blok in beeld komt.
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      // Minder beweging: meteen de eindstand.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setTyped(EMAIL);
        setSent(true);
      } else run();
    }, { threshold: 0.4 });
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
      timers = [];
    };
  }, []);

  return (
    <section className="border-t border-border py-20">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Win meer op <span className="text-primary">offerteplatforms</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Aanvraag binnen? Tik het e-mailadres in en klik. Binnen een minuut heeft je klant jouw
            prijs.
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

        <div ref={ref} className="lg:px-40">
          {/* Het blok Snelle acties */}
          <div className="rounded-2xl border border-border bg-background p-5 shadow-xl">
            <p className="font-semibold">Snelle acties</p>
            <p className="text-sm text-muted-foreground">Stuur je linkje naar een nieuwe aanvraag.</p>
            <MobileNote>Kant-en-klaar bericht, met je linkje erin</MobileNote>
            <div className="relative rounded-lg border border-border bg-muted/50 p-3 text-sm leading-relaxed lg:mt-4">
              <SideNote side="right">Kant-en-klaar bericht, met je linkje erin</SideNote>
              Hoi! Bedankt voor je aanvraag. Via deze link scan je je kamers met je telefoon, en
              binnen een minuut heb je onze offerte in je mailbox:{" "}
              <span className="break-all text-primary underline">{LINK}</span>
              <br />
              <br />
              Groet, Jouw Verhuisbedrijf
            </div>
            <MobileNote>Eén klik naar WhatsApp</MobileNote>
            <div className="relative flex gap-2 lg:mt-3">
              <SideNote side="left">Eén klik naar WhatsApp</SideNote>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 py-2 text-sm font-medium text-white">
                <MessageCircle className="size-4" /> WhatsApp
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium">
                <Copy className="size-4" /> Kopieer
              </span>
            </div>
            <MobileNote>De mail gaat uit op jouw naam</MobileNote>
            <div className="relative flex gap-2 lg:mt-3">
              <SideNote side="right">De mail gaat uit op jouw naam</SideNote>
              <span className="flex h-9 min-w-0 flex-1 items-center rounded-md border border-border px-3 text-sm">
                {typed ? (
                  <span className="truncate">{typed}</span>
                ) : (
                  <span className="truncate text-muted-foreground">E-mailadres klant</span>
                )}
                {!sent && <span className="ml-px h-4 w-px animate-pulse bg-foreground" />}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition ${pressed ? "scale-95 opacity-80" : ""}`}
              >
                <Mail className="size-4" /> Mail
              </span>
            </div>
            <p
              className={`mt-3 flex items-center gap-1.5 text-sm text-emerald-600 transition-opacity duration-300 ${sent ? "opacity-100" : "opacity-0"}`}
              aria-live="polite"
            >
              <Check className="size-4" /> Verstuurd naar {EMAIL}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
