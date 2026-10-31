import type { Metadata } from "next";
import { Clock, Globe, Palette, Wrench } from "lucide-react";
import { SolutionPage } from "@/app/_components/solution-page";
import { WebsiteVisual } from "@/app/_components/website-visual";

export const metadata: Metadata = {
  title: "Onsite: offertes op je website",
  description:
    "Een knop op je eigen website: je bezoeker maakt foto's per kamer en heeft binnen een minuut jouw offerte. Ook 's avonds en in het weekend.",
};

export default function OnsitePage() {
  return (
    <SolutionPage
      c={{
        name: "Onsite",
        sub: "Op je website",
        Icon: Globe,
        title: (
          <>
            Je website haalt aanvragen binnen.{" "}
            <span className="text-brand-600">Ook &apos;s avonds en in het weekend.</span>
          </>
        ),
        intro:
          "Een knop op je eigen site opent moverAI in jouw huisstijl. Je bezoeker maakt een paar foto's per kamer en heeft binnen een minuut jouw offerte. Jij krijgt de aanvraag met foto's en inventarislijst.",
        visual: <WebsiteVisual />,
        steps: [
          { title: "Eén regel code", text: "Plak hem in je website, of stuur hem naar je webbouwer." },
          { title: "Bezoeker klikt", text: "Op \"Offerte in 1 minuut\" op jouw site." },
          { title: "Foto's per kamer", text: "Met zijn telefoon of laptop. De AI telt de inboedel en de m³." },
          {
            title: "Offerte en aanvraag",
            text: "Je bezoeker krijgt jouw offerte. Jij krijgt de aanvraag met alles erbij.",
          },
        ],
        benefits: [
          {
            Icon: Clock,
            title: "Werkt dag en nacht",
            text: "Bezoekers die 's avonds of in het weekend op je site komen, vragen meteen een offerte aan.",
          },
          {
            Icon: Palette,
            title: "In jouw huisstijl",
            text: "Je eigen naam, kleur en contactgegevens. Je klant ziet nergens moverAI.",
          },
          {
            Icon: Wrench,
            title: "Op elke website",
            text: "WordPress, Wix, Squarespace, Shopify en andere. Binnen een kwartier live.",
          },
          {
            Icon: Globe,
            title: "Meer uit Google en social media",
            text: "Bezoekers haken niet af bij een lang formulier. Ze krijgen direct een prijs.",
          },
        ],
        faqs: [
          {
            q: "Moet ik technisch zijn?",
            a: "Nee. Je plakt één regel code in je website-instellingen. In het dashboard staat stap voor stap waar dat zit, en je kunt hem ook naar je webbouwer sturen.",
          },
          {
            q: "Ziet mijn klant moverAI, of mijn eigen merk?",
            a: "Je eigen merk. De knop, het venster en de offertemail tonen jouw bedrijfsnaam, kleur en contactgegevens.",
          },
          {
            q: "Wat als ik geen website heb?",
            a: "Dan gebruik je Onlink: je stuurt je klant een linkje. Dat werkt meteen.",
          },
        ],
      }}
    />
  );
}
