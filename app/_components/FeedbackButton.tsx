"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { X, Send, Loader2, CheckCircle } from "lucide-react";
import { CATEGORIEEN, type FeedbackCategorie } from "@/lib/feedback";

export function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [categorie, setCategorie] = useState<FeedbackCategorie>("idee");
  const [bericht, setBericht] = useState("");
  const [magReageren, setMagReageren] = useState(true);
  const [loading, setLoading] = useState(false);
  const [verstuurd, setVerstuurd] = useState(false);

  const gekozen = CATEGORIEEN.find((c) => c.value === categorie) ?? CATEGORIEEN[3];

  const verstuur = async () => {
    if (!bericht.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categorie, bericht, magReageren, pagina: pathname }),
      });
      if (!response.ok) throw new Error("Feedback versturen mislukt");
      setVerstuurd(true);
      setBericht("");
      setTimeout(() => {
        setVerstuurd(false);
        setOpen(false);
      }, 2500);
    } catch {
      alert("Versturen mislukt, probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  const formHeader = (
    <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Feedback over moverAI</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Gaat direct naar ons team.</p>
      </div>
      <button
        type="button"
        aria-label="Feedbackformulier sluiten"
        onClick={() => setOpen(false)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground/80 transition-all hover:bg-red-100 hover:text-red-500">
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );

  const formInhoud = verstuurd ? (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center text-brand-600">
      <CheckCircle size={32} />
      <p className="text-sm font-semibold">Bedankt!</p>
      <p className="text-xs text-muted-foreground">
        {magReageren
          ? "We kijken ernaar en nemen contact met je op als we vragen hebben."
          : "We kijken ernaar."}
      </p>
    </div>
  ) : (
    <div className="space-y-4 p-5">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Waar gaat het over?</p>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIEEN.map((c, i) => (
            <button
              type="button"
              key={c.value}
              onClick={() => setCategorie(c.value)}
              aria-pressed={categorie === c.value}
              className={`rounded-full border-2 px-2 py-2 text-xs font-medium transition-all ${
                i === CATEGORIEEN.length - 1 ? "col-span-2" : ""
              } ${
                categorie === c.value
                  ? "border-brand-600 bg-brand-50 text-foreground"
                  : "border-border text-muted-foreground hover:border-border"
              }`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <textarea
        value={bericht}
        onChange={(e) => setBericht(e.target.value)}
        placeholder={gekozen.vraag}
        aria-label="Je feedback"
        rows={5}
        className="w-full resize-none rounded-2xl border-2 border-border bg-muted p-4 text-sm outline-none transition-all placeholder:text-muted-foreground/80 focus:border-brand-600"
      />
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={magReageren}
          onChange={(e) => setMagReageren(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
        />
        <span className="text-xs leading-tight text-muted-foreground">
          Jullie mogen me hierover mailen of bellen
        </span>
      </label>

      <button
        type="button"
        onClick={verstuur}
        disabled={!bericht.trim() || loading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-700 disabled:opacity-50">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        {loading ? "Versturen..." : "Versturen"}
      </button>
    </div>
  );

  const tabKnop = (extra: string, onClick: () => void) => (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className={`flex shrink-0 items-center justify-center rounded-l-xl bg-brand-600 text-white transition-all hover:bg-brand-700 ${extra}`}
      style={{ width: "42px", height: "110px" }}>
      <span
        className="whitespace-nowrap text-xs font-semibold tracking-wide"
        style={{ transform: "rotate(-90deg)" }}>
        Feedback
      </span>
    </button>
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-white/70 backdrop-blur-md sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:hidden">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-background shadow-2xl">
            {formHeader}
            {formInhoud}
          </div>
        </div>
      )}

      <div className="fixed top-2/3 right-0 z-50 hidden -translate-y-1/2 items-center sm:flex">
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            open ? "w-80 opacity-100" : "w-0 opacity-0"
          }`}>
          <div className="w-80 rounded-l-3xl border border-border bg-background shadow-xl">
            {formHeader}
            {formInhoud}
          </div>
        </div>
        {tabKnop("", () => setOpen((v) => !v))}
      </div>

      {!open && (
        <div className="fixed top-2/3 right-0 z-50 -translate-y-1/2 sm:hidden">
          {tabKnop("", () => setOpen(true))}
        </div>
      )}
    </>
  );
}
