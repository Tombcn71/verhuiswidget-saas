"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy } from "lucide-react";

const KEY = "crm-last-copied";
const EVENT = "crm-last-copied-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

function lastCopied() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/**
 * Kopieert de bedrijfsnaam, om het bedrijf snel op te zoeken op LinkedIn, Facebook of Instagram.
 * De laatst gekopieerde blijft gemarkeerd (ook na herladen), zodat je ziet waar je gebleven bent.
 */
export function CopyName({ id, name }: { id: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const isLast = useSyncExternalStore(subscribe, lastCopied, () => null) === id;

  return (
    <button
      type="button"
      title={isLast ? "Laatst gekopieerd" : "Naam kopiëren"}
      aria-label={`${name} kopiëren`}
      data-last-copied={isLast || undefined}
      onClick={() => {
        void navigator.clipboard.writeText(name);
        try {
          localStorage.setItem(KEY, id);
        } catch {}
        window.dispatchEvent(new Event(EVENT));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={`ml-1.5 inline-flex size-6 items-center justify-center rounded-md align-middle transition ${
        isLast ? "bg-amber-400 text-slate-900" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}
