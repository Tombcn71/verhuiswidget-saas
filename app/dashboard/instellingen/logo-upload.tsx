"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

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
    <div className="block">
      <span className="text-sm font-medium text-slate-700">Logo</span>
      <input type="hidden" name="logoUrl" value={url} />
      <div className="mt-1 flex items-center gap-4">
        <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- extern Blob-adres, vaste kleine maat
            <img src={url} alt="Logo" className="max-h-14 max-w-26 object-contain" />
          ) : (
            <span className="text-xs text-slate-400">Geen logo</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {busy ? "Uploaden…" : url ? "Ander logo" : "Logo uploaden"}
          </button>
          {url && !busy && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-red-600"
            >
              Verwijderen
            </button>
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
      <span className="mt-1 block text-xs text-slate-400">
        PNG, JPG of WebP, max. 2 MB. Bij voorkeur een liggend logo met transparante achtergrond.
        Klik daarna op Opslaan.
      </span>
      {(uploadError || error) && (
        <span className="mt-1 block text-xs text-red-600">{uploadError ?? error}</span>
      )}
    </div>
  );
}
