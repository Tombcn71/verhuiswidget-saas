import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import heroImage from "@/public/hero.jpg";
import { HeroTimer } from "@/app/_components/hero-timer";
import { Logo } from "@/app/_components/logo";
import { LinkVisual } from "@/app/_components/link-visual";
import { WebsiteVisual } from "@/app/_components/website-visual";
import { SpotVisual } from "@/app/_components/spot-visual";
import { VisitCalculator } from "@/app/_components/visit-calculator";

export const metadata: Metadata = { title: "Reel", robots: { index: false, follow: false } };

const REELS = {
  home: {
    // Startscherm in de demovideo: onderdeel en de volledige kop.
    label: "Zo werkt het",
    header: <>Win meer klussen. <span className="text-brand-600">Bespaar uren en brandstof.</span></>,
    // Korte belofte voor het beginscherm (max. 5 à 6 woorden).
    intro: <>Offerte in <span className="text-brand-600">1&nbsp;minuut.</span></>,
    // Smalle strook rond de telefoon: het witte inventariskader rechts in de foto valt erbuiten.
    // Langzaam inzoomen geeft beweging; de timer telt naar "Offerte klaar".
    visual: (
      <div className="relative mx-auto aspect-9/16 w-[22rem] overflow-hidden rounded-2xl shadow-xl ring-1 ring-border">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="34rem"
          className="object-cover object-[47%_50%]"
          style={{ animation: "reel-zoom 13s ease-out forwards" }}
        />
        <HeroTimer />
        <style>{"@keyframes reel-zoom{from{transform:scale(1)}to{transform:scale(1.12)}}"}</style>
      </div>
    ),
  },
  onlink: {
    // Startscherm in de demovideo: onderdeel en de volledige kop.
    label: "Onlink · Via een linkje",
    header: <>Aanvraag via een offerteplatform? <span className="text-brand-600">Binnen 1 minuut jouw offerte.</span></>,
    // Korte belofte voor het beginscherm (max. 5 à 6 woorden).
    intro: <>Als eerste bij <span className="text-brand-600">offerteplatforms.</span></>,
    visual: <LinkVisual stickers />,
  },
  onsite: {
    // Startscherm in de demovideo: onderdeel en de volledige kop.
    label: "Onsite · Op je website",
    header: <>De moverAI-widget op je website. <span className="text-brand-600">Offertes, ook &apos;s avonds en in het weekend.</span></>,
    // Korte belofte voor het beginscherm (max. 5 à 6 woorden).
    intro: <>moverAI op <span className="text-brand-600">je website.</span></>,
    visual: <WebsiteVisual stickers />,
  },
  rekenhulp: {
    // Startscherm in de demovideo: onderdeel en de volledige kop.
    label: "Rekenhulp",
    header: <>Wat kosten voorinspecties <span className="text-brand-600">jou</span>?</>,
    // Korte belofte voor het beginscherm (max. 5 à 6 woorden).
    intro: <>Wat kost een <span className="text-brand-600">voorinspectie?</span></>,
    visual: (
      <div className="origin-center">
        <VisitCalculator autoplay />
      </div>
    ),
  },
  onspot: {
    // Startscherm in de demovideo: onderdeel en de volledige kop.
    label: "Onspot · Op locatie",
    header: <>Scan ter plekke. <span className="text-brand-600">Jouw klant direct een offerte.</span></>,
    // Korte belofte voor het beginscherm (max. 5 à 6 woorden).
    intro: <>Offerte <span className="text-brand-600">ter&nbsp;plekke.</span></>,
    visual: (
      <div className="mx-auto w-[17rem] origin-center scale-[1.3]">
        <SpotVisual stickers />
      </div>
    ),
  },
} as const;

/**
 * Staand beeld (9:16) van een van de drie animaties, om op te nemen als
 * Instagram-reel. Ontworpen op 540 × 960; opnemen op 2× geeft 1080 × 1920.
 */
export default async function ReelPage({ params, searchParams }: PageProps<"/reel/[slug]">) {
  const { slug } = await params;
  if (slug === "einde") return <EndCard />;
  const reel = REELS[slug as keyof typeof REELS];
  if (!reel) notFound();
  // ?intro=1: het beginscherm (ca. 2 s) dat voor de animatie komt.
  const sp = await searchParams;
  if (sp.intro) return <IntroCard text={reel.intro} />;
  // ?start=1: startscherm voor een onderdeel van de demovideo (Tom klein rechtsonder in beeld).
  if (sp.start) return <StartCard label={reel.label} header={reel.header} />;
  // ?full=1 bij home: de foto schermvullend (voor de demovideo, niet voor de feed).
  if (sp.full && slug === "home") return <HomeFull />;

  return (
    // Alles binnen het middelste 4:5-deel (540 × 675): zo snijdt Instagram een reel bij in de
    // feed. Boven en onder 142 px vrij (285 px op 1080 × 1920).
    // Alleen de animatie, zo groot mogelijk binnen het middelste 4:5-deel (540 × 675): zo
    // snijdt Instagram een reel bij in de feed. Kop, logo en "plan een demogesprek" staan
    // in het onderschrift.
    <div className="flex h-[960px] w-[540px] items-center justify-center overflow-hidden bg-linear-to-b from-brand-50 to-white px-4 py-[146px] text-slate-900">
      <div className="w-full">{reel.visual}</div>
    </div>
  );
}

/**
 * Beginscherm van een reel: bovenaan het logo, dan wat het is ("AI-software voor
 * verhuizers") en daaronder groot de belofte. Alles binnen het 4:5-deel.
 */
function IntroCard({ text }: { text: React.ReactNode }) {
  return (
    <div className="flex h-[960px] w-[540px] flex-col items-center bg-linear-to-b from-brand-50 to-white px-10 py-[160px] text-center text-slate-900">
      <Logo className="text-4xl" />
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-[1.9rem] leading-tight font-bold text-slate-700">AI-software voor verhuizers</p>
        <h1 className="mt-6 text-[3.6rem] leading-[1.05] font-extrabold tracking-tight">{text}</h1>
      </div>
    </div>
  );
}

/** Home-animatie schermvullend voor de demovideo: alleen de foto, langzaam inzoomend. */
function HomeFull() {
  return (
    <div className="relative h-[960px] w-[540px] overflow-hidden bg-black">
      <Image
        src={heroImage}
        alt=""
        fill
        priority
        sizes="34rem"
        className="object-cover object-[47%_50%]"
        style={{ animation: "reel-zoom 13s ease-out forwards" }}
      />
      <style>{"@keyframes reel-zoom{from{transform:scale(1)}to{transform:scale(1.12)}}"}</style>
    </div>
  );
}

/** Startscherm voor een onderdeel van de demovideo; rechtsonder blijft ruimte voor Tom. */
function StartCard({ label, header }: { label: string; header: React.ReactNode }) {
  return (
    <div className="flex h-[960px] w-[540px] flex-col items-center bg-linear-to-b from-brand-50 to-white px-10 pt-[160px] pb-[300px] text-center text-slate-900">
      <Logo className="text-3xl" />
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="rounded-full bg-brand-600 px-4 py-1.5 text-lg font-semibold text-white">{label}</p>
        <h1 className="mt-6 text-[2.5rem] leading-[1.1] font-extrabold tracking-tight">{header}</h1>
      </div>
    </div>
  );
}

/** Eindscherm voor de demovideo: plan een demogesprek. */
function EndCard() {
  return (
    <div className="flex h-[960px] w-[540px] flex-col items-center justify-center gap-6 bg-linear-to-b from-brand-50 to-white px-10 text-center text-slate-900">
      <Logo className="text-4xl" />
      <p className="text-[2.6rem] leading-tight font-bold tracking-tight">
        Plan een <span className="text-brand-600">demogesprek</span>
      </p>
      <p className="rounded-full bg-brand-600 px-8 py-3 text-2xl font-semibold text-white">moverai.nl</p>
    </div>
  );
}
