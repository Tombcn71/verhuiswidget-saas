"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FileText, Inbox, Mail } from "lucide-react";

const REPLY =
  "Hoi! Bedankt voor je aanvraag. Via deze link scan je je kamers met je telefoon, en binnen een minuut heb je onze offerte in je mailbox: moverai.nl/offerte/jouw-bedrijf\nEen bezoek aan huis is niet nodig.";
const LINK = "moverai.nl/offerte/jouw-bedrijf";
const STEPS = ["Aanvraag", "Linkje", "Offerte"];
// Oudere, gelezen mails onder de nieuwe aanvraag: maakt de inbox echt.
const INBOX = [
  { from: "Familie de Vries", subject: "Vraag over opslag in december", when: "09:12" },
  { from: "Planning", subject: "Ritten donderdag: 2 ploegen", when: "Gisteren" },
  { from: "Boekhouder", subject: "Facturen oktober", when: "Gisteren" },
];

// Tijdlijn in stappen van 100 ms: aanvraag 3 s, antwoord typen + verstuurd 5 s, offerte 4 s.
const T_REPLY = 30;
const T_OFFER = 80;
const T_END = 120;

/**
 * Onlink-kop: een aanvraag komt binnen via een offerteplatform, jij antwoordt met
 * het linkje, en je klant heeft binnen een minuut je offerte. Speelt alleen als
 * hij in beeld is; zonder animatie (reduced motion) staat de offerte er meteen.
 */
export function LinkVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let id: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setT(T_OFFER);
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

  const step = t < T_REPLY ? 0 : t < T_OFFER ? 1 : 2;
  // Het antwoord typt zich in ca. 3,5 s; daarna "Verstuurd".
  const typed = REPLY.slice(0, Math.round(((t - T_REPLY) / 35) * REPLY.length));
  const sent = t >= T_REPLY + 38;

  return (
    <div ref={ref} className="rounded-2xl border border-border bg-background p-5 shadow-xl">
      <div className="min-h-64 text-slate-800 dark:text-slate-100">
        {step === 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Inbox className="size-3.5" /> Inbox
            </p>
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border text-sm">
              {/* De nieuwe aanvraag schuift bovenaan binnen */}
              <li className="animate-in fade-in slide-in-from-top-3 bg-brand-50 px-3 py-2.5 duration-500 dark:bg-brand-700/20">
                <p className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-brand-600" />
                  <span className="font-semibold">Offerteplatform</span>
                  <span className="ml-auto text-xs font-semibold text-brand-700 dark:text-brand-100">Nu</span>
                </p>
                <p className="mt-0.5 pl-4 font-semibold">Nieuwe aanvraag: Utrecht → Amersfoort</p>
                <p className="pl-4 text-xs text-muted-foreground">
                  3-kamerappartement · 15 maart · ook gestuurd naar andere verhuizers
                </p>
              </li>
              {INBOX.map((m) => (
                <li key={m.from} className="px-3 py-2.5 text-muted-foreground">
                  <p className="flex items-center gap-2 pl-4">
                    <span>{m.from}</span>
                    <span className="ml-auto text-xs">{m.when}</span>
                  </p>
                  <p className="truncate pl-4 text-xs">{m.subject}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Mail className="size-3.5" /> Jouw antwoord, met één klik
            </p>
            <div className="mt-3 ml-auto max-w-[92%] rounded-xl rounded-tr-sm bg-[#d9fdd3] p-3 text-sm whitespace-pre-line text-slate-800 shadow-sm">
              {typed.split(LINK).map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && <span className="text-sky-700 underline">{LINK}</span>}
                </span>
              ))}
              {!sent && <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-slate-500 align-middle" />}
              {sent && (
                <span className="mt-1 block text-right text-[11px] text-slate-500">Verstuurd · 19:42 ✓✓</span>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <FileText className="size-3.5" /> Bij je klant
            </p>
            <div className="mt-3 rounded-xl border border-border bg-white p-4 text-slate-800 shadow-sm">
              <p className="flex items-center gap-1.5 font-semibold">
                <FileText className="size-4 text-brand-600" /> Je offerte van Jouw Verhuisbedrijf
              </p>
              <p className="mt-1 text-sm text-slate-600">23,7 m³ · 3 verhuizers · 6 uur</p>
              <p className="mt-1 text-2xl font-bold">€ 1.240</p>
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <Check className="size-3.5" /> Binnen 1 minuut
              </p>
              <span className="mx-auto mt-4 block w-3/4 rounded-full bg-brand-600 py-2.5 text-center text-sm font-semibold text-white">
                Nu boeken
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Waar we zijn: aanvraag → linkje → offerte */}
      <ol className="mt-4 flex items-center justify-center gap-2 text-xs">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 font-medium transition ${
                i === step ? "bg-brand-600 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}. {s}
            </span>
            {i < STEPS.length - 1 && <span className="text-muted-foreground">→</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
