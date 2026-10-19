"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-1.5 pl-3">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm">
        {code}
      </code>
      <Button type="button" size="sm" variant={copied ? "secondary" : "default"} onClick={copy}>
        {copied ? <Check /> : <Copy />}
        {copied ? "Gekopieerd" : "Kopieer"}
      </Button>
    </div>
  );
}
