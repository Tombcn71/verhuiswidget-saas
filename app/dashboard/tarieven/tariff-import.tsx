"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, Sparkles } from "lucide-react";
import type { ExtractedTariffs } from "@/lib/gemini";
import { deriveWorkSettings, type InvoiceJob } from "@/lib/tariff-derive";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Bedragen: veldnaam in het tarievenformulier → label voor de samenvatting. */
const MONEY_FIELDS = [
  ["hourlyRatePerMover", "Uurtarief per verhuizer"],
  ["vanRate", "Verhuiswagen"],
  ["pricePerM3", "Prijs per m³"],
  ["baseFee", "Voorrijkosten"],
  ["pricePerKm", "Prijs per km"],
  ["liftFee", "Verhuislift"],
  ["packingFee", "Inpakservice"],
  ["assemblyFee", "(De)montage"],
  ["boxPrice", "Verhuisdoos"],
  ["storagePerMonth", "Opslag per maand"],
  ["minPrice", "Minimale offerteprijs"],
  ["rushSurcharge", "Spoedtoeslag"],
] as const satisfies readonly (readonly [keyof ExtractedTariffs, string])[];

/** Formulierwaarden (veldnaam → waarde) + labels voor de samenvatting. */
type FormValues = { values: Record<string, string>; labels: string[] };

function tariffValues(t: ExtractedTariffs): FormValues {
  const values: Record<string, string> = {};
  const labels: string[] = [];
  for (const [name, label] of MONEY_FIELDS) {
    const v = t[name];
    if (typeof v !== "number") continue;
    values[name] = v.toFixed(2);
    labels.push(label);
  }
  if (t.vanRateUnit) values.vanRateUnit = t.vanRateUnit;
  if (t.minHours != null) {
    values.minHours = String(t.minHours);
    labels.push("Minimaal aantal uren");
  }
  if (t.roundingMinutes != null) {
    values.roundingMinutes = String(t.roundingMinutes);
    labels.push("Afronding");
  }
  if (t.saturdaySurchargePct != null) {
    values.saturdaySurchargePct = String(t.saturdaySurchargePct);
    labels.push("Zaterdagtoeslag");
  }
  if (t.sundaySurchargePct != null) {
    values.sundaySurchargePct = String(t.sundaySurchargePct);
    labels.push("Zondagtoeslag");
  }
  return { values, labels };
}

function workValues(job: InvoiceJob, travelIncluded: boolean): FormValues | null {
  const w = deriveWorkSettings(job, travelIncluded);
  if (!w) return null;
  return {
    values: {
      tempoM3: String(w.tempoM3),
      tempoHours: String(w.tempoHours),
      tempoMovers: String(w.tempoMovers),
      crewTwoMaxM3: String(w.crewTwoMaxM3),
      crewThreeMaxM3: String(w.crewThreeMaxM3),
      travelMode: w.travelMode,
    },
    labels: ["Tempo", "Ploeg", "Reistijd"],
  };
}

const nl = (n: number) => n.toLocaleString("nl-NL");

/**
 * "Snel instellen": sleep een oude factuur of offerte hierheen en de AI vult de
 * tarieven én de manier van rekenen in (tempo, ploeg, reistijd). Er wordt niets
 * opgeslagen tot de verhuizer zelf op Opslaan klikt.
 */
export function TariffImport({
  apply,
}: {
  /** Zet waarden in het formulier en geeft terug welke velden echt bestonden. */
  apply: (t: ExtractedTariffs | null, values: Record<string, string>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<{ summary: string; filled: string[] } | null>(null);
  // Klus op de factuur waarvan we niet weten of het rijden in de uren zit.
  const [askTravel, setAskTravel] = useState<InvoiceJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setAskTravel(null);
    try {
      const body = new FormData();
      for (const f of Array.from(files)) body.append("files", f);
      const res = await fetch("/api/tariff-import", { method: "POST", body });
      const json = (await res.json()) as { tariffs?: ExtractedTariffs; error?: string };
      if (!res.ok || !json.tariffs) throw new Error(json.error ?? "Lezen lukte niet.");
      const t = json.tariffs;
      const tariffs = tariffValues(t);
      const known = t.job.travelIncluded;
      const work = known === null ? null : workValues(t.job, known);
      apply(t, { ...tariffs.values, ...(work?.values ?? {}) });
      setResult({ summary: t.summary, filled: [...tariffs.labels, ...(work?.labels ?? [])] });
      if (known === null && workValues(t.job, false)) setAskTravel(t.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lezen lukte niet.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function answerTravel(included: boolean) {
    if (!askTravel) return;
    const work = workValues(askTravel, included);
    if (work) {
      apply(null, work.values);
      setResult((r) => (r ? { ...r, filled: [...r.filled, ...work.labels] } : r));
    }
    setAskTravel(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" /> Snel instellen
        </CardTitle>
        <CardDescription>
          Sleep een oude factuur of offerte hierheen. De AI leest je tarieven en hoe je rekent,
          en vult ze hieronder voor je in. Het bestand wordt alleen gelezen en niet bewaard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void upload(e.dataTransfer.files);
          }}
          className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-sm transition ${
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
          }`}
        >
          {busy ? (
            <>
              <Loader2 className="size-6 animate-spin text-primary" />
              <span>Je tarieven worden gelezen…</span>
            </>
          ) : (
            <>
              <FileUp className="size-6 text-primary" />
              <span className="font-medium">Kies of sleep een factuur of offerte</span>
              <span className="text-muted-foreground">pdf of foto, samen max. 4 MB</span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => void upload(e.target.files)}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        {askTravel && (
          <div className="rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 text-sm">
            <p className="font-medium">
              Op je factuur: {nl(askTravel.movers ?? 0)} man × {nl(askTravel.hours ?? 0)} uur voor{" "}
              {nl(askTravel.volumeM3 ?? 0)} m³
              {askTravel.km ? ` (${nl(askTravel.km)} km)` : ""}. Zit het rijden in die{" "}
              {nl(askTravel.hours ?? 0)} uur?
            </p>
            <div className="mt-3 flex gap-2">
              <Button type="button" size="sm" onClick={() => answerTravel(true)}>
                Ja, rijden zit erin
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => answerTravel(false)}>
                Nee, alleen werk
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
            {result.summary && <p>{result.summary}</p>}
            {result.filled.length > 0 ? (
              <p className="mt-2">
                <span className="font-medium">Ingevuld:</span> {result.filled.join(", ")}.{" "}
                Controleer ze hieronder en klik op <strong>Tarieven opslaan</strong>.
              </p>
            ) : (
              <p className="mt-2">
                Er stonden geen tarieven op die we konden overnemen. Vul ze hieronder zelf in.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
