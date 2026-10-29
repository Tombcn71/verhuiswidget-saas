"use client";

import { ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyBlock } from "@/app/dashboard/embed/copy-block";
import { whatsappAction } from "../../actions";

/**
 * Berichten voor WhatsApp. Openen of kopiëren wordt in het CRM bijgehouden
 * (openingsbericht → Benaderd, demolink → Demo gestuurd).
 */
export function WhatsappMessages({
  id,
  waNumber,
  website,
  opening,
  demoReply,
}: {
  id: string;
  waNumber: string | null;
  website: string | null;
  opening: string;
  demoReply: string;
}) {
  const sentOpening = () => void whatsappAction(id, "opening");
  return (
    <>
      {waNumber ? (
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(opening)}`}
            target="_blank"
            rel="noopener"
            onClick={sentOpening}
          >
            <MessageCircle /> Open WhatsApp met openingsbericht
          </a>
        </Button>
      ) : (
        website && (
          <Button asChild variant="outline">
            <a href={website} target="_blank" rel="noopener">
              <ExternalLink /> Open hun website
            </a>
          </Button>
        )
      )}
      <p className="text-sm font-medium">Openingsbericht</p>
      <CopyBlock multiline code={opening} onCopy={sentOpening} />
      <p className="text-sm font-medium">Zegt hij ja</p>
      <CopyBlock multiline code={demoReply} onCopy={() => void whatsappAction(id, "demo")} />
      <p className="text-sm font-medium">Demo gedaan</p>
      <CopyBlock multiline code="Hoi! Ik zag dat je de demo hebt gedaan. Wat vond je ervan?" />
    </>
  );
}
