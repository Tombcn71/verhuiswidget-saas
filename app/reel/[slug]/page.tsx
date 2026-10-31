import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/app/_components/logo";
import { LinkVisual } from "@/app/_components/link-visual";
import { WebsiteVisual } from "@/app/_components/website-visual";
import { SpotVisual } from "@/app/_components/spot-visual";
import { VisitCalculator } from "@/app/_components/visit-calculator";

export const metadata: Metadata = { title: "Reel", robots: { index: false, follow: false } };

const REELS = {
  onlink: {
    title: (
      <>
        Aanvraag via een offerteplatform?{" "}
        <span className="text-brand-600">Binnen 1 minuut jouw offerte.</span>
      </>
    ),
    visual: <LinkVisual />,
  },
  onsite: {
    title: (
      <>
        Je website haalt aanvragen binnen.{" "}
        <span className="text-brand-600">Ook &apos;s avonds en in het weekend.</span>
      </>
    ),
    visual: <WebsiteVisual />,
  },
  rekenhulp: {
    title: (
      <>
        Wat kosten bezoeken aan huis <span className="text-brand-600">jou</span>?
      </>
    ),
    visual: <VisitCalculator autoplay />,
  },
  onspot: {
    title: (
      <>
        Scan ter plekke.{" "}
        <span className="text-brand-600">Jouw klant direct een offerte.</span>
      </>
    ),
    visual: (
      <div className="origin-center">
        <SpotVisual />
      </div>
    ),
  },
} as const;

/**
 * Staand beeld (9:16) van een van de drie animaties, om op te nemen als
 * Instagram-reel. Ontworpen op 540 × 960; opnemen op 2× geeft 1080 × 1920.
 */
export default async function ReelPage({ params }: PageProps<"/reel/[slug]">) {
  const { slug } = await params;
  if (slug === "einde") return <EndCard />;
  const reel = REELS[slug as keyof typeof REELS];
  if (!reel) notFound();

  return (
    <div className="flex h-[960px] w-[540px] flex-col items-center overflow-hidden bg-linear-to-b from-brand-50 to-white px-8 pt-24 pb-36 text-slate-900">
      <Logo className="text-2xl" />
      <h1 className="mt-8 text-center text-[2.1rem] leading-tight font-bold tracking-tight">{reel.title}</h1>
      <div className="flex w-full flex-1 items-center justify-center py-6">
        <div className="w-full">{reel.visual}</div>
      </div>
      <p className="text-center text-lg font-semibold">
        Plan een demogesprek op <span className="text-brand-600">moverai.nl</span>
      </p>
    </div>
  );
}

/** Eindscherm voor de demovideo: plan een demogesprek. */
function EndCard() {
  return (
    <div className="flex h-[960px] w-[540px] flex-col items-center justify-center gap-6 bg-linear-to-b from-brand-50 to-white px-10 text-center text-slate-900">
      <Logo className="text-4xl" />
      <p className="mt-6 text-[2.6rem] leading-tight font-bold tracking-tight">
        Plan een <span className="text-brand-600">demogesprek</span>
      </p>
      <p className="text-xl text-slate-600">5 minuten · vrijblijvend</p>
      <p className="mt-4 rounded-full bg-brand-600 px-8 py-3 text-2xl font-semibold text-white">moverai.nl</p>
    </div>
  );
}
