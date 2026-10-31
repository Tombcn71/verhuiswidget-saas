import type { Metadata } from "next";
import { Building2, ClipboardList, MapPin, Timer } from "lucide-react";
import { SolutionPage } from "@/app/_components/solution-page";
import { SpotVisual } from "@/app/_components/solution-visuals";

export const metadata: Metadata = {
  title: "Onspot: scannen op locatie",
  description:
    "Scan de ruimtes met je telefoon, zie de m³ direct oplopen en heb de offerte ter plekke klaar. Ook voor grote panden en ontruimingen.",
};

export default function OnspotPage() {
  return (
    <SolutionPage
      c={{
        name: "Onspot",
        sub: "Op locatie",
        Icon: MapPin,
        title: (
          <>
            Scan ter plekke.{" "}
            <span className="text-brand-600">Jouw klant direct een offerte.</span>
          </>
        ),
        intro:
          "Sta je bij de klant, of bij een groot pand zoals een kantoor of ontruiming? Open moverAI in de browser op je telefoon, scan de ruimtes en heb de offerte ter plekke klaar.",
        visual: <SpotVisual />,
        steps: [
          { title: "Open moverAI", text: "In de browser op je telefoon." },
          { title: "Foto's per ruimte", text: "Loop door het pand en fotografeer elke ruimte." },
          { title: "AI telt mee", text: "De inboedel en de m³ lopen per ruimte op." },
          { title: "Offerte ter plekke", text: "Met jouw tarieven, nog voordat je weer in de wagen zit." },
        ],
        benefits: [
          {
            Icon: Timer,
            title: "Geen rekenwerk achteraf",
            text: "Geen notities en optellen op kantoor. De offerte is klaar als je vertrekt.",
          },
          {
            Icon: Building2,
            title: "Ook voor grote panden",
            text: "Kantoren, bedrijfspanden en ontruimingen: per ruimte scannen houdt het overzichtelijk.",
          },
          {
            Icon: ClipboardList,
            title: "Inventarislijst voor je ploeg",
            text: "Alles wat gescand is, staat op een lijst. Handig voor de planning en op de dag zelf.",
          },
          {
            Icon: MapPin,
            title: "Indruk op je klant",
            text: "Je klant ziet je de offerte ter plekke maken. Dat geeft vertrouwen, en de klus sneller rond.",
          },
        ],
        faqs: [
          {
            q: "Werkt het ook voor ontruimingen?",
            a: "Ja. Je kiest of het om een verhuizing of een ontruiming gaat, en rekent met de tarieven die daarbij horen.",
          },
          {
            q: "Hoe nauwkeurig is het volume?",
            a: "De AI herkent de meubels op de foto's en rekent per item met vaste volumes. Je ziet de lijst en past aantallen aan of voegt items toe voordat je de offerte maakt.",
          },
        ],
      }}
    />
  );
}
