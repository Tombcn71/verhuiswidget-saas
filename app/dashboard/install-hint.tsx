"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DISMISS_KEY = "moverai:install-hint-dismissed";

type InstallPrompt = Event & { prompt: () => Promise<void> };

const noSubscribe = () => () => {};

/** "hidden" als de app al geïnstalleerd draait of de melding is weggeklikt. */
function detectDevice(): "hidden" | "ios" | "other" {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  let dismissed = false;
  try {
    dismissed = localStorage.getItem(DISMISS_KEY) === "1";
  } catch {}
  if (standalone || dismissed) return "hidden";
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "other";
}

/**
 * "Zet moverAI op je startscherm": verborgen als de app al vanaf het startscherm
 * draait of de verhuizer de melding heeft weggeklikt. Android/Chrome krijgt een
 * installeerknop; iPhone kan dat niet, dus daar staan de stappen.
 */
export function InstallHint() {
  // Alleen in de browser te bepalen; op de server (null) tonen we niets.
  const device = useSyncExternalStore(noSubscribe, detectDevice, () => null);
  const [closed, setClosed] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setClosed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  if (!device || device === "hidden" || closed) return null;
  const ios = device === "ios";

  return (
    <Card className="mb-6 py-4">
      <CardContent className="flex gap-3">
        <Smartphone className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="flex-1 text-sm">
          <p className="font-semibold">Zet moverAI op je startscherm</p>
          <p className="mt-1 text-muted-foreground">
            Open moverAI met één tik, schermvullend zoals een app. Handig als je op locatie scant.
          </p>
          {prompt ? (
            <Button
              size="sm"
              className="mt-3"
              onClick={async () => {
                await prompt.prompt();
                setPrompt(null);
              }}
            >
              Installeren
            </Button>
          ) : ios ? (
            <ol className="mt-2 list-decimal space-y-0.5 pl-5">
              <li>Open deze pagina in Safari.</li>
              <li>
                Tik onderin op <strong>Deel</strong> (het vierkantje met het pijltje omhoog).
              </li>
              <li>
                Kies <strong>Zet op beginscherm</strong> en tik op <strong>Voeg toe</strong>.
              </li>
              <li>Open moverAI vanaf je beginscherm en log één keer opnieuw in.</li>
            </ol>
          ) : (
            <ul className="mt-2 space-y-1.5">
              <li>
                <strong>iPhone:</strong> open moverAI in Safari, tik onderin op{" "}
                <strong>Deel</strong> (het vierkantje met het pijltje omhoog), kies{" "}
                <strong>Zet op beginscherm</strong> en tik op <strong>Voeg toe</strong>. Log daarna
                één keer opnieuw in.
              </li>
              <li>
                <strong>Android:</strong> open moverAI in Chrome, tik op de drie puntjes
                rechtsboven en kies <strong>App installeren</strong> of{" "}
                <strong>Toevoegen aan startscherm</strong>.
              </li>
              <li>
                <strong>Mac met Safari:</strong> kies bovenaan in de menubalk{" "}
                <strong>Archief</strong> (of <strong>File</strong>) en dan{" "}
                <strong>Voeg toe aan Dock</strong>. moverAI staat daarna als app in je Dock.
              </li>
              <li>
                <strong>Computer met Chrome of Edge:</strong> klik op het installeer-icoon rechts in
                de adresbalk.
              </li>
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Melding sluiten"
          className="self-start rounded p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </CardContent>
    </Card>
  );
}
