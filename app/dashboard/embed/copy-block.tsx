"use client";

import { useState } from "react";

export function CopyBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard niet beschikbaar */
    }
  }

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute right-3 top-3 rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20"
      >
        {copied ? "Gekopieerd" : "Kopieer"}
      </button>
    </div>
  );
}
