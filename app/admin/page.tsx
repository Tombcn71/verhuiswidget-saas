"use client";

import { useState } from "react";
import { Loader2, MessageSquare, Lock, Mail } from "lucide-react";
import { CATEGORIEEN, categorieLabel } from "@/lib/feedback";
import { Logo } from "@/app/_components/logo";

interface FeedbackItem {
  id: number;
  user_email: string | null;
  categorie: string;
  bericht: string;
  mag_reageren: boolean;
  company_name: string | null;
  plan: string | null;
  pagina: string | null;
  created_at: string;
}

export default function AdminPage() {
  const [wachtwoord, setWachtwoord] = useState("");
  const [items, setItems] = useState<FeedbackItem[] | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fout, setFout] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFout(false);
    try {
      const res = await fetch(`/api/feedback?pw=${encodeURIComponent(wachtwoord)}`);
      if (!res.ok) {
        setFout(true);
        return;
      }
      setItems(await res.json());
    } catch {
      setFout(true);
    } finally {
      setLoading(false);
    }
  };

  if (items) {
    const zichtbaar = filter ? items.filter((i) => i.categorie === filter) : items;
    const aantal = (cat: string) => items.filter((i) => i.categorie === cat).length;

    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-12">
        <header className="mx-auto mb-8 max-w-3xl">
          <Logo className="text-base" />
          <h1 className="mt-6 text-2xl font-bold tracking-tight">Feedback van verhuizers</h1>
          <p className="mt-1 text-sm text-slate-500">
            {items.length} bericht{items.length !== 1 ? "en" : ""}
          </p>
        </header>

        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={() => setFilter("")}
              className={`rounded-full border px-3 py-1 ${
                filter === "" ? "border-brand-600 bg-brand-50" : "border-slate-200 bg-white"
              }`}>
              Alles ({items.length})
            </button>
            {CATEGORIEEN.map((c) => (
              <button
                type="button"
                key={c.value}
                onClick={() => setFilter(c.value)}
                className={`rounded-full border px-3 py-1 ${
                  filter === c.value ? "border-brand-600 bg-brand-50" : "border-slate-200 bg-white"
                }`}>
                {c.label} ({aantal(c.value)})
              </button>
            ))}
          </div>

          {zichtbaar.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
              <MessageSquare className="mx-auto mb-3 text-slate-300" size={32} />
              <p className="text-sm text-slate-500">Nog geen feedback in deze categorie</p>
            </div>
          ) : (
            <div className="space-y-4">
              {zichtbaar.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{categorieLabel(item.categorie)}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(item.created_at).toLocaleString("nl-NL")}
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800">
                    {item.bericht}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span>
                      {item.company_name ?? "Onbekend bedrijf"}
                      {item.plan && ` · ${item.plan}`}
                      {item.pagina && ` · ${item.pagina}`}
                      {item.user_email && ` · ${item.user_email}`}
                    </span>
                    {item.mag_reageren && item.user_email && (
                      <a
                        href={`mailto:${item.user_email}?subject=${encodeURIComponent(
                          "Je feedback over moverAI",
                        )}&body=${encodeURIComponent(
                          `Hoi,\n\nBedankt voor je feedback!\n\n\n---\nJouw bericht:\n"${item.bericht}"`,
                        )}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 font-semibold text-brand-700 hover:bg-brand-100">
                        <Mail size={12} /> Reageren
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <form onSubmit={login} className="w-full max-w-sm space-y-4 p-8">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
          <Lock size={24} className="text-brand-600" />
        </div>
        <h1 className="text-center text-2xl font-bold tracking-tight">Admin</h1>
        <input
          type="password"
          value={wachtwoord}
          onChange={(e) => setWachtwoord(e.target.value)}
          placeholder="Wachtwoord"
          className="w-full rounded-2xl border-2 border-slate-200 bg-white p-4 outline-none transition-all focus:border-brand-600"
          autoFocus
        />
        {fout && <p className="text-center text-sm text-red-500">Wachtwoord onjuist</p>}
        <button
          type="submit"
          disabled={!wachtwoord || loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-4 text-sm font-semibold text-white transition-all hover:bg-brand-700 disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Inloggen"}
        </button>
      </form>
    </div>
  );
}
