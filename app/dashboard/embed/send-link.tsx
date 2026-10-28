"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { mailLink } from "./actions";

/** Eén kort bericht met het linkje, te versturen via WhatsApp, mail of kopiëren. */
export function SendLink({ defaultMessage }: { defaultMessage: string }) {
  const [message, setMessage] = useState(defaultMessage);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard niet beschikbaar */
    }
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    startTransition(async () => {
      const r = await mailLink(email, message);
      if (r.ok) {
        setStatus({ ok: true, text: `Verstuurd naar ${email}` });
        setEmail("");
      } else setStatus({ ok: false, text: r.error });
    });
  }

  return (
    <div className="space-y-3">
      <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />

      <div className="flex flex-wrap gap-2">
        <Button asChild className="bg-[#25D366] text-white hover:bg-[#1ebe5b]">
          <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener">
            <MessageCircle /> WhatsApp
          </a>
        </Button>
        <Button type="button" variant="outline" onClick={copy}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Gekopieerd" : "Kopieer"}
        </Button>
      </div>

      <form onSubmit={send} className="flex gap-2">
        <Input
          type="email"
          required
          placeholder="E-mailadres klant"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" disabled={pending}>
          <Mail /> {pending ? "Versturen…" : "Mail"}
        </Button>
      </form>
      {status && (
        <p className={`text-sm ${status.ok ? "text-emerald-600" : "text-destructive"}`}>{status.text}</p>
      )}
    </div>
  );
}
