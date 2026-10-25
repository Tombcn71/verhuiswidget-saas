"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, Sparkles } from "lucide-react";
import type { ExtractedTariffs } from "@/lib/gemini";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Veldnaam in het tarievenformulier → label voor de samenvatting. */
export const IMPORT_FIELDS = [
  ["hourlyRatePerMover", "Uurtarief per verhuizer"],
  ["m3PerHourPerMover", "Laadsnelheid"],
  ["pricePerM3", "Prijs per m³"],
  ["baseFee", "Voorrijkosten"],
  ["pricePerKm", "Prijs per km"],
  ["liftFee", "Verhuislift"],
  ["packingFee", "Inpakservice"],
  ["assemblyFee", "(De)montage"],
  ["storagePerMonth", "Opslag per maand"],
  ["minPrice", "Minimale offerteprijs"],
  ["rushSurcharge", "Spoedtoeslag"],
] as const satisfies readonly (readonly [keyof ExtractedTariffs, string])[];

/**
 * "Snel instellen": sleep een oude factuur of offerte hierheen en de AI vult de
 * tarieven in. Er wordt niets opgeslagen tot de verhuizer zelf op Opslaan klikt.
 */
export function TariffImport({ onResult }: { onResult: (t: ExtractedTariffs) => string[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<{ summary: string; filled: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const body = new FormData();
      for (const f of Array.from(files)) body.append("files", f);
      const res = await fetch("/api/tariff-import", { method: "POST", body });
      const json = (await res.json()) as { tariffs?: ExtractedTariffs; error?: string };
      if (!res.ok || !json.tariffs) throw new Error(json.error ?? "Lezen lukte niet.");
      setResult({ summary: json.tariffs.summary, filled: onResult(json.tariffs) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lezen lukte niet.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" /> Snel instellen
        </CardTitle>
        <CardDescription>
          Sleep een oude factuur of offerte hierheen. De AI leest je tarieven en vult ze
          hieronder voor je in. Het bestand wordt alleen gelezen en niet bewaard.
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
