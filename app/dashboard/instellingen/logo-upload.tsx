"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * Logo kiezen en direct naar Vercel Blob uploaden. De URL gaat via een verborgen
 * veld mee met het formulier; pas bij "Opslaan" staat het logo op het bedrijf.
 */
export function LogoUpload({
  companyId,
  defaultValue,
  error,
}: {
  companyId: string;
  defaultValue: string;
  error?: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Het bestand is groter dan 2 MB.");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const blob = await upload(`logos/${companyId}.${ext}`, file, {
        access: "public",
        handleUploadUrl: "/api/logo-upload",
      });
      setUrl(blob.url);
    } catch {
      setUploadError("Uploaden mislukt. Gebruik een PNG, JPG of WebP van maximaal 2 MB.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid content-start gap-1.5">
      <Label>Logo</Label>
      <input type="hidden" name="logoUrl" value={url} />
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-44 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/50 p-2">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- extern Blob-adres, vaste kleine maat
            <img src={url} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-muted-foreground">Geen logo</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? "Uploaden…" : url ? "Ander logo" : "Logo uploaden"}
          </Button>
          {url && !busy && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setUrl("")}
              className="text-muted-foreground hover:text-destructive"
            >
              Verwijderen
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      <span className="block text-xs text-muted-foreground">
        PNG, JPG of WebP, max. 2 MB. Bij voorkeur een liggend logo met transparante achtergrond.
        Klik daarna op Opslaan.
      </span>
      {(uploadError || error) && (
        <span className="block text-xs text-destructive">{uploadError ?? error}</span>
      )}
    </div>
  );
}
