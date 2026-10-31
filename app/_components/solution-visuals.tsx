import Image from "next/image";
import { Camera, FileText, Sparkles, Truck } from "lucide-react";
import moversPhoto from "@/public/onsite-verhuizers.jpg";

/** Onlink: het bericht met het linkje, en de offerte die je klant terugkrijgt. */
export function LinkVisual() {
  return (
    <div className="rounded-2xl border border-border bg-[#efeae2] p-5 shadow-xl dark:bg-slate-800">
      <div className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-[#d9fdd3] p-3 text-sm text-slate-800 shadow-sm">
        Hoi! Bedankt voor je aanvraag. Via deze link scan je je kamers met je telefoon, en binnen
        een minuut heb je onze offerte in je mailbox:{" "}
        <span className="text-sky-700 underline">moverai.nl/offerte/jouw-bedrijf</span>
        <span className="mt-1 block text-right text-[11px] text-slate-500">19:42 ✓✓</span>
      </div>
      <div className="mt-4 max-w-[80%] rounded-xl rounded-tl-sm bg-white p-3 text-sm text-slate-800 shadow-sm">
        <p className="flex items-center gap-1.5 font-semibold">
          <FileText className="size-4 text-brand-600" /> Je offerte van Jouw Verhuisbedrijf
        </p>
        <p className="mt-1 text-slate-600">23,7 m³ · 3 verhuizers · 6 uur</p>
        <p className="mt-1 text-lg font-bold">€ 1.240</p>
        <span className="mt-1 block text-right text-[11px] text-slate-500">19:43</span>
      </div>
    </div>
  );
}

/** Onsite: de website van een verhuizer, met de knop die moverAI opent. */
export function WebsiteVisual() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
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
          <span className="mt-3 inline-block rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold shadow">
            Offerte in 1 minuut
          </span>
        </div>
      </div>
    </div>
  );
}

/** Onspot: het startscherm van de scan op een telefoon: kamers scannen, dan de AI-analyse. */
export function SpotVisual() {
  return (
    <div className="relative mx-auto flex aspect-9/16 w-full max-w-[17rem] flex-col rounded-[2.75rem] border-[10px] border-slate-900 bg-white px-5 pt-10 pb-6 text-slate-900 shadow-xl dark:border-slate-700">
      {/* Camera-eiland */}
      <span className="absolute top-2.5 left-1/2 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900 dark:bg-slate-700" />
      <p className="text-center text-base font-bold">Foto&apos;s van de inboedel</p>
      <p className="mt-1 text-center text-xs text-slate-500">Kamer voor kamer, de AI doet de rest</p>
      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-slate-200 p-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-600 text-white">
          <Camera className="size-6" />
        </span>
        <span className="text-base font-semibold">Scan de kamers</span>
        <span className="text-xs leading-snug text-slate-500">
          Maak foto&apos;s terwijl je door het huis loopt
        </span>
      </div>
      <span className="mt-auto flex items-center justify-center gap-2 rounded-full bg-brand-600 py-3 text-sm font-semibold text-white">
        <Sparkles className="size-4" /> Start AI-analyse
      </span>
    </div>
  );
}
