import type { Metadata } from "next";
import { SiteHeader } from "@/app/_components/site-header";
import { SiteFooter } from "@/app/_components/site-footer";
import { WhatsAppButton } from "@/app/_components/whatsapp-button";
import { PricingCards } from "@/app/_components/pricing-cards";

export const metadata: Metadata = {
  title: "Pakketten",
  description: "Basic, Pro of Op maat. In een demogesprek van 5 minuten zie je welk pakket bij je past.",
};

export default function PackagesPage() {
  const calendlyUrl = process.env.CALENDLY_URL ?? null;
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted py-16">
        <div className="mx-auto w-full max-w-5xl px-6">
          <h1 className="text-center text-4xl font-bold tracking-tight">Pakketten</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Met Basic geef je al 100 klanten per maand binnen een minuut jouw offerte, zonder langs te
            gaan. Twee bezoeken aan huis minder en je hebt het al terugverdiend. Elke extra klus is
            winst. In een demogesprek van 5 minuten laat ik zien welk pakket bij je past.
          </p>
          <PricingCards demo={{ href: calendlyUrl }} />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Demogesprek: 5 minuten · vrijblijvend
          </p>
        </div>
      </main>
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
