import type { Metadata } from "next";
import { BellRing, House, Link, Trophy, UserRound } from "lucide-react";
import { SolutionPage } from "@/app/_components/solution-page";
import { LinkVisual } from "@/app/_components/link-visual";
import { PlatformShowcase } from "@/app/_components/platform-showcase";

export const metadata: Metadata = {
  title: "Onlink: offerte via een linkje",
  description:
    "Aanvraag via een offerteplatform, telefoon of WhatsApp? Stuur je klant een linkje en binnen een minuut heeft hij jouw offerte.",
};

export default function OnlinkPage() {
  return (
    <SolutionPage
      c={{
        name: "Onlink",
        sub: "Via een linkje",
        Icon: Link,
        title: (
          <>
            Stuur je klant een linkje.{" "}
            <span className="text-brand-600">Binnen een minuut heeft hij jouw offerte.</span>
          </>
        ),
        intro:
          "Voor elke aanvraag via een offerteplatform, de telefoon of WhatsApp. Tik het e-mailadres in of stuur het via WhatsApp. Je klant scant zijn kamers met zijn telefoon en krijgt je offerte, met jouw tarieven.",
        visual: <LinkVisual />,
        steps: [
          { title: "Aanvraag binnen", text: "Via een offerteplatform, de telefoon of WhatsApp." },
          { title: "Eén klik", text: "Tik het e-mailadres in of stuur het via WhatsApp. Het bericht staat al klaar." },
          { title: "Je klant scant", text: "Een paar foto's per kamer met zijn telefoon." },
          {
            title: "Offerte binnen een minuut",
            text: "Je klant krijgt jouw offerte. Jij krijgt de aanvraag met foto's en inventarislijst.",
          },
        ],
        extra: <PlatformShowcase />,
        benefits: [
          {
            Icon: Trophy,
            title: "Als eerste bij offerteplatforms",
            text: "Wie het eerst een echte offerte stuurt, maakt de meeste kans. Jij bent er binnen een minuut.",
          },
          {
            Icon: House,
            title: "Geen bezoek aan huis",
            text: "Je klant maakt zelf de foto's. Dat scheelt uren en brandstof, ook bij klanten die niet boeken.",
          },
          {
            Icon: BellRing,
            title: "Herinnering vanzelf",
            text: "Boekt je klant niet meteen? Na 2 dagen krijgt hij vanzelf een herinnering.",
          },
          {
            Icon: UserRound,
            title: "Jouw naam, jouw tarieven",
            text: "Je klant ziet jouw bedrijfsnaam en kleur, en een prijs zoals jij die zou rekenen.",
          },
        ],
        faqs: [
          {
            q: "Hoe verstuur ik het linkje?",
            a: "Vanuit je dashboard. Tik het e-mailadres in en wij mailen het namens jou, of stuur het via WhatsApp met het bericht al klaar. Kopiëren en zelf plakken kan ook.",
          },
          {
            q: "Werkt het ook zonder website?",
            a: "Ja. Het linkje werkt meteen, ook als je geen website hebt.",
          },
        ],
      }}
    />
  );
}
