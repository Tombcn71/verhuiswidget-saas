"use client";

import { Check, ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyBlock } from "@/app/dashboard/embed/copy-block";
import type { WhatsappVariant } from "@/lib/prospects";
import { whatsappAction } from "../../actions";

const VARIANT_LABEL: Record<WhatsappVariant, string> = {
  A: "Opening A · offerteplatforms",
  B: "Opening B · kosten bezoeken",
};

/**
 * Berichten voor WhatsApp, met twee openingsberichten om te vergelijken. Openen
 * of kopiëren wordt in het CRM bijgehouden (opening → Benaderd, vervolg → Demo
 * gestuurd); "Heeft gereageerd" telt mee in de vergelijking van A en B.
 */
export function WhatsappMessages({
  id,
  waNumber,
  website,
  openings,
  replies,
  sentVariant,
  replied,
}: {
  id: string;
  waNumber: string | null;
  website: string | null;
  openings: Record<WhatsappVariant, string>;
  replies: Record<WhatsappVariant, string>;
  /** Al gestuurde opening; null = nog niet geappt. */
  sentVariant: WhatsappVariant | null;
  replied: boolean;
}) {
  const variants: WhatsappVariant[] = sentVariant ? [sentVariant] : ["A", "B"];

  return (
    <>
      {!waNumber && website && (
        <Button asChild variant="outline">
          <a href={website} target="_blank" rel="noopener">
            <ExternalLink /> Open hun website
          </a>
        </Button>
      )}
      {!sentVariant && (
        <p className="text-sm text-muted-foreground">Gebruik A en B om de beurt, dan zie je welke beter werkt.</p>
      )}

      {variants.map((v) => {
        const sentOpening = () => void whatsappAction(id, "opening", v);
        return (
          <div key={v} className="space-y-2 rounded-lg border p-3">
            <p className="text-sm font-medium">
              {VARIANT_LABEL[v]}
              {sentVariant && <span className="font-normal text-muted-foreground"> · gestuurd</span>}
            </p>
            {waNumber && !sentVariant && (
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <a
                  href={`https://wa.me/${waNumber}?text=${encodeURIComponent(openings[v])}`}
                  target="_blank"
                  rel="noopener"
                  onClick={sentOpening}
                >
                  <MessageCircle /> Open WhatsApp met opening {v}
                </a>
              </Button>
            )}
            <CopyBlock multiline code={openings[v]} onCopy={sentVariant ? undefined : sentOpening} />
          </div>
        );
      })}

      {sentVariant && (
        <>
          {replied ? (
            <p className="flex items-center gap-1.5 text-sm text-emerald-700">
              <Check className="size-4" /> Heeft gereageerd
            </p>
          ) : (
            <Button variant="outline" size="sm" onClick={() => void whatsappAction(id, "replied")}>
              <Check /> Heeft gereageerd
            </Button>
          )}
          <p className="text-sm font-medium">Zegt hij ja</p>
          <CopyBlock
            multiline
            code={replies[sentVariant]}
            onCopy={() => void whatsappAction(id, "demo")}
          />
        </>
      )}

      <p className="text-sm font-medium">Demo gedaan</p>
      <CopyBlock multiline code="Hoi! Ik zag dat je de demo hebt gedaan. Wat vond je ervan?" />
    </>
  );
}
