"use client";

import { useState, useTransition } from "react";
import { Check, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoMailAction } from "./actions";

/** 📞 Bellen (vast nummer) en "Demo mailen" (persoonlijke demolink per e-mail). */
export function ContactButtons({
  id,
  phone,
  email,
  sent,
  size = "sm",
}: {
  id: string;
  phone: string | null;
  email: string | null;
  /** Demo al eens gemaild: knop heet dan "Opnieuw mailen". */
  sent: boolean;
  size?: "sm" | "default";
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {phone && (
        // Het nummer zelf, goed leesbaar om over te toetsen op je mobiel;
        // op een telefoon belt een tik er direct heen.
        <Button
          asChild
          size={size}
          variant="outline"
          title={`Bel ${phone}`}
          className="font-mono text-sm font-semibold tracking-wide tabular-nums"
        >
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
            <Phone /> {phone}
          </a>
        </Button>
      )}
      <Button
        type="button"
        size={size}
        variant={sent ? "outline" : "default"}
        disabled={pending || !email}
        title={email ? `Demo mailen naar ${email}` : "Vul eerst een e-mailadres in"}
        onClick={() => {
          if (sent && !confirm(`De demo opnieuw mailen naar ${email}?`)) return;
          start(async () => setResult(await demoMailAction(id)));
        }}
      >
        {result?.ok ? <Check /> : <Mail />}
        {pending ? "Versturen…" : result?.ok ? "Verstuurd" : sent ? "Opnieuw mailen" : "Demo mailen"}
      </Button>
      {result && !result.ok && <span className="basis-full text-right text-xs text-destructive">{result.message}</span>}
    </div>
  );
}
