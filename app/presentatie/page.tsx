import type { Metadata } from "next";
import { Slides } from "./slides";

export const metadata: Metadata = {
  title: "moverAI in 1 minuut",
  description: "AI-software voor verhuizers: offerte in 1 minuut, zonder huisbezoek.",
  robots: { index: false, follow: false },
};

/** Presentatie om als link via WhatsApp te sturen; de laatste dia plant een adviesgesprek. */
export default function PresentationPage() {
  return <Slides calendlyUrl={process.env.CALENDLY_URL ?? null} />;
}
