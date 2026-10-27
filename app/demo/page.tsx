import type { Metadata } from "next";
import { Widget } from "@/app/widget/[companyId]/widget";
import { DEMO_COMPANY_PUBLIC } from "@/lib/demo";

export const metadata: Metadata = {
  title: { absolute: "Probeer moverAI in 1 minuut" },
  description: "Maak foto's van een kamer en zie hoe de AI de meubels herkent en direct een offerte maakt.",
};

/** Algemene demolink (bijv. om te delen): de demo schermvullend, zonder homepage eromheen. */
export default function DemoPage() {
  return (
    <div className="mx-auto w-full max-w-md bg-white sm:shadow-xl sm:ring-1 sm:ring-slate-200">
      <Widget company={DEMO_COMPANY_PUBLIC} demo calendlyUrl={process.env.CALENDLY_URL ?? null} />
    </div>
  );
}
