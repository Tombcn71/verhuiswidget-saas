import type { Metadata } from "next";
import { SiteHeader } from "@/app/_components/site-header";
import { SiteFooter } from "@/app/_components/site-footer";
import { WhatsAppButton } from "@/app/_components/whatsapp-button";
import { VisitCalculator } from "@/app/_components/visit-calculator";
import { PlanDemoButton } from "@/app/_components/plan-demo-button";

export const metadata: Metadata = {
  title: "Wat kosten bezoeken aan huis jou?",
  description:
    "Schuif naar hoeveel bezoeken aan huis je per week doet en zie wat ze je per maand kosten aan uren en brandstof.",
};

/** Losse rekenhulp: om via WhatsApp of een advertentie te delen. Doel: een demo plannen. */
export default function CalculatorPage() {
  const calendlyUrl = process.env.CALENDLY_URL ?? null;
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted py-16">
        <div className="mx-auto w-full max-w-3xl px-6">
          <h1 className="text-center text-4xl font-bold tracking-tight">
            Wat kosten bezoeken aan huis <span className="text-primary">jou</span>?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            Schuif naar hoeveel bezoeken je per week doet.
          </p>
          <div className="mt-10">
            <VisitCalculator />
          </div>
          <div className="mt-10 text-center">
            <p className="text-lg font-semibold">Benieuwd hoeveel jij daarvan kunt besparen?</p>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              Met moverAI maakt je klant zelf een paar foto&apos;s per kamer en heeft hij binnen een
              minuut jouw offerte. Zonder bezoek aan huis.
            </p>
            <PlanDemoButton href={calendlyUrl} from="rekenhulp" className="mt-6" />
            <p className="mt-3 text-sm text-muted-foreground">5 minuten · vrijblijvend</p>
          </div>
        </div>
      </main>
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
