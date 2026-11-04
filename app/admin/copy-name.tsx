"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Kopieert de bedrijfsnaam, om het bedrijf snel op te zoeken op LinkedIn, Facebook of Instagram. */
export function CopyName({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title="Naam kopiëren"
      aria-label={`${name} kopiëren`}
      onClick={() => {
        void navigator.clipboard.writeText(name);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-1.5 inline-flex size-6 items-center justify-center rounded-md align-middle text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
    </button>
  );
}
