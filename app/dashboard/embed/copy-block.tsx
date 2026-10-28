"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

/** `multiline`: tekst met regels (bijv. een kant-en-klaar bericht) in plaats van één regel code. */
export function CopyBlock({ code, multiline = false }: { code: string; multiline?: boolean }) {
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
    <div
      className={`flex gap-2 rounded-lg border bg-muted/50 p-1.5 pl-3 ${multiline ? "items-start py-3" : "items-center"}`}
    >
      {multiline ? (
        <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm">{code}</p>
      ) : (
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm">
          {code}
        </code>
      )}
      <Button type="button" size="sm" variant={copied ? "secondary" : "default"} onClick={copy}>
        {copied ? <Check /> : <Copy />}
        {copied ? "Gekopieerd" : "Kopieer"}
      </Button>
    </div>
  );
}
