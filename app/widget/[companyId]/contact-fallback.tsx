"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import type { LeadSource } from "@/lib/leads";

const ACCENT_BG = "bg-(--accent)";

/**
 * Als de scans van de verhuizer deze maand op zijn: geen foto's en geen prijs,
 * alleen gegevens achterlaten. De verhuizer krijgt de aanvraag en belt terug.
 */
export function ContactFallback({
  company,
  source,
  showName,
  showToggle,
  forcedType,
}: {
  company: { id: string; name: string; logoUrl: string | null; phone: string | null };
  source: LeadSource;
  showName: boolean;
  showToggle: boolean;
  forcedType: "verhuizing" | "ontruiming" | null;
}) {
  const [moveType, setMoveType] = useState<"verhuizing" | "ontruiming">(forcedType ?? "verhuizing");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [moveDate, setMoveDate] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/widget/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          source,
          moveType,
          customer: { name, email, phone },
          fromAddress,
          moveDate,
          message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Versturen mislukte. Probeer het nog een keer.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis.");
    } finally {
      setSending(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5";
  const label = "mb-1.5 block text-xs font-medium text-slate-500";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="px-6 py-8">
      {(showName || company.logoUrl) && (
        <div className="mb-6 flex items-center gap-3">
          {company.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoUrl} alt="" className="h-10 w-auto max-w-32 object-contain" />
          )}
          {showName && <p className="font-semibold">{company.name}</p>}
        </div>
      )}

      {sent ? (
        <div className="py-10 text-center">
          <CircleCheck className="mx-auto size-10 text-emerald-600" />
          <h2 className="mt-4 text-xl font-bold">Bedankt, je aanvraag is verstuurd</h2>
          <p className="mt-2 text-sm text-slate-600">
            {company.name} neemt zo snel mogelijk contact met je op.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Vraag een offerte aan</h2>
            <p className="mt-1 text-sm text-slate-600">
              Laat je gegevens achter, dan neemt {company.name} snel contact met je op.
            </p>
          </div>

          {showToggle && (
            <div className="grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1 text-sm font-medium">
              {(["verhuizing", "ontruiming"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMoveType(t)}
                  className={`rounded-full py-2 ${moveType === t ? `${ACCENT_BG} text-white` : "text-slate-500"}`}
                >
                  {t === "verhuizing" ? "Verhuizing" : "Ontruiming"}
                </button>
              ))}
            </div>
          )}

          <label className="block">
            <span className={label}>Naam</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} autoComplete="name" />
          </label>
          <label className="block">
            <span className={label}>E-mail</span>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
          </label>
          <label className="block">
            <span className={label}>Telefoon</span>
            <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} autoComplete="tel" placeholder="06 12345678" />
          </label>
          <label className="block">
            <span className={label}>{moveType === "ontruiming" ? "Adres" : "Huidig adres"}</span>
            <input value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} className={inputCls} autoComplete="street-address" placeholder="Straat, huisnummer en plaats" />
          </label>
          <label className="block">
            <span className={label}>Gewenste datum (optioneel)</span>
            <input type="date" min={today} value={moveDate} onChange={(e) => setMoveDate(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className={label}>Toelichting (optioneel)</span>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={inputCls}
              placeholder="Bijvoorbeeld: 3-kamerappartement, 2e verdieping zonder lift"
            />
          </label>

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={sending}
            className={`w-full rounded-full py-3.5 text-sm font-semibold text-white shadow-lg disabled:opacity-60 ${ACCENT_BG}`}
          >
            {sending ? "Versturen…" : "Verstuur aanvraag"}
          </button>
          {company.phone && (
            <p className="text-center text-xs text-slate-500">
              Liever bellen? <a href={`tel:${company.phone}`} className="underline">{company.phone}</a>
            </p>
          )}
        </form>
      )}
    </div>
  );
}
