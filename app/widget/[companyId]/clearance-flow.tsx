"use client";

import { useState } from "react";

type CompanyPublic = {
  id: string;
  name: string;
  primaryColor: string;
  serviceType: "verhuizen" | "ontruimen" | "beide";
};

type ClearItem = { name: string; quantity: number; size: string };
type PriceLine = { label: string; amountCents: number };
type ClearResult = {
  demo?: boolean;
  fillLevel: string;
  items: ClearItem[];
  estimatedBoxes: number;
  specialItems: string[];
  breakdown: PriceLine[];
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  emailSent: boolean;
};

const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const fmt = (c: number) => euro.format((c ?? 0) / 100);
const AI_GRADIENT = "bg-linear-to-br from-blue-600 via-indigo-600 to-violet-600";

const PROPERTY_TYPES = [
  "Woning",
  "Appartement",
  "Kamer",
  "Studio",
  "Seniorenkamer / zorgkamer",
  "Bedrijfsruimte",
  "Overig",
];

const WORKS = [
  { key: "floorRemoval", label: "Vloer verwijderen" },
  { key: "wallpaper", label: "Behang verwijderen" },
  { key: "holes", label: "Gaatjes stoppen" },
  { key: "painting", label: "Schilderwerk" },
  { key: "curtains", label: "Gordijnen verwijderen" },
] as const;

const FILL_LABEL: Record<string, string> = {
  minimaal: "minimaal bewoond",
  normaal: "normaal bewoond",
  vol: "vol",
  overvol: "overvol",
};

async function downscale(file: File, maxSize = 1600, quality = 0.8): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", quality),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

export function ClearanceFlow({
  company,
  demo,
  onBack,
}: {
  company: CompanyPublic;
  demo: boolean;
  onBack?: () => void;
}) {
  const accent = company.primaryColor;
  const fillClass = demo ? AI_GRADIENT : "";
  const fillStyle = demo ? undefined : { background: accent };

  const [step, setStep] = useState(0);
  const [name, setName] = useState(demo ? "Demo Gebruiker" : "");
  const [email, setEmail] = useState(demo ? "demo@voorbeeld.nl" : "");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [areaM2, setAreaM2] = useState("");
  const [floor, setFloor] = useState("0");
  const [hasLift, setHasLift] = useState(false);
  const [works, setWorks] = useState<Record<string, boolean>>({});
  const [photos, setPhotos] = useState<{ id: string; file: Blob; url: string }[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClearResult | null>(null);

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

  const step0Valid =
    name.trim().length > 1 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) &&
    Number(areaM2) > 0;

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    const incoming: { id: string; file: Blob; url: string }[] = [];
    for (const file of Array.from(list).slice(0, 10)) {
      const blob = await downscale(file);
      incoming.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: blob,
        url: URL.createObjectURL(blob),
      });
    }
    setPhotos((p) => [...p, ...incoming].slice(0, 10));
  }

  function removePhoto(id: string) {
    setPhotos((ps) => {
      const t = ps.find((p) => p.id === id);
      if (t) URL.revokeObjectURL(t.url);
      return ps.filter((p) => p.id !== id);
    });
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        companyId: company.id,
        customer: { name, email, phone },
        postcode,
        propertyType,
        areaM2: Number(areaM2) || 0,
        floor: Number(floor) || 0,
        hasLift,
        works: {
          floorRemoval: !!works.floorRemoval,
          wallpaper: !!works.wallpaper,
          holes: !!works.holes,
          painting: !!works.painting,
          curtains: !!works.curtains,
        },
      };
      const fd = new FormData();
      fd.append("payload", JSON.stringify(payload));
      photos.forEach((p, i) => fd.append("photos", p.file, `foto-${i + 1}.jpg`));

      const res = await fetch("/api/widget/clearance", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Er ging iets mis.");
      setResult(data as ClearResult);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Voortgang */}
      {step < 2 && (
        <ol className="mb-6 flex gap-1">
          {["Gegevens", "Foto's", "Resultaat"].slice(0, 2).map((label, i) => (
            <li key={label} className="flex-1">
              <div
                className={`h-1.5 rounded-full ${i <= step && demo ? AI_GRADIENT : ""}`}
                style={{ background: i <= step ? (demo ? undefined : accent) : "#e2e8f0" }}
              />
              <span className="mt-1 block text-[11px] text-slate-500">{label}</span>
            </li>
          ))}
        </ol>
      )}

      {step === 0 && (
        <div className="space-y-4">
          {onBack && (
            <button onClick={onBack} className="text-xs text-slate-400 hover:text-slate-600">← Andere dienst</button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium">Postcode</span>
              <input className={inputCls} value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Bijv. 3000 AB" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Oppervlak (m²) *</span>
              <input
                className={inputCls}
                inputMode="numeric"
                value={areaM2}
                onChange={(e) => setAreaM2(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Bijv. 75"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium">Woningtype</span>
              <select className={inputCls} value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                <option value="">Selecteer type</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Verdieping</span>
              <select className={inputCls} value={floor} onChange={(e) => setFloor(e.target.value)}>
                <option value="0">Begane grond</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}e verdieping</option>
                ))}
              </select>
            </label>
          </div>

          {Number(floor) > 0 && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={hasLift} onChange={(e) => setHasLift(e.target.checked)} />
              Er is een lift
            </label>
          )}

          <div>
            <label className="text-sm font-medium">Extra werkzaamheden (optioneel)</label>
            <div className="mt-2 space-y-1.5">
              {WORKS.map((w) => (
                <label key={w.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!works[w.key]}
                    onChange={(e) => setWorks((s) => ({ ...s, [w.key]: e.target.checked }))}
                  />
                  {w.label}
                </label>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium">Naam *</span>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">E-mailadres *</span>
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Telefoonnummer</span>
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Upload foto&apos;s van de woning. Maak per kamer één overzichtsfoto — dan kan de
            AI de vulgraad goed inschatten.
          </p>
          <div className="flex flex-wrap gap-2">
            {photos.map((p) => (
              <div key={p.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-20 w-20 rounded object-cover" />
                <button
                  onClick={() => removePhoto(p.id)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded border border-dashed border-slate-300 text-2xl text-slate-400 hover:bg-slate-50">
              +
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  void onFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="text-xs text-slate-400">{photos.length} / 10 foto&apos;s · minimaal 1</p>
        </div>
      )}

      {step === 2 && result && (
        <div className="space-y-5">
          <div className={`rounded-lg p-4 text-white ${fillClass}`} style={fillStyle}>
            <p className="text-sm opacity-90">Je offerte-indicatie</p>
            <p className="text-3xl font-bold">{fmt(result.totalCents)}</p>
            <p className="text-sm opacity-90">
              incl. btw · {areaM2} m² · {FILL_LABEL[result.fillLevel] ?? result.fillLevel}
            </p>
          </div>

          <p className="text-sm text-slate-600">
            {result.demo
              ? "Bij een echte aanvraag ontvangt de klant deze offerte per e-mail en verschijnt de lead in jouw dashboard."
              : `We hebben de offerte naar ${email} gestuurd. ${company.name} neemt binnenkort contact met je op.`}
          </p>

          <div>
            <h3 className="mb-1 text-sm font-semibold">Prijsopbouw</h3>
            <table className="w-full text-sm">
              <tbody>
                {result.breakdown.map((l, i) => (
                  <tr key={i}>
                    <td className="py-1 text-slate-600">{l.label}</td>
                    <td className="py-1 text-right">{fmt(l.amountCents)}</td>
                  </tr>
                ))}
                <tr className="border-t border-slate-200">
                  <td className="py-1">Btw</td>
                  <td className="py-1 text-right">{fmt(result.vatCents)}</td>
                </tr>
                <tr className="border-t-2 border-slate-900 font-bold">
                  <td className="py-1">Totaal</td>
                  <td className="py-1 text-right">{fmt(result.totalCents)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-semibold">Herkende inboedel</h3>
            <ul className="text-sm text-slate-600">
              {result.items.map((it, i) => (
                <li key={i} className="flex justify-between border-b border-slate-100 py-1">
                  <span>{it.quantity}× {it.name}</span>
                  <span className="capitalize text-slate-400">{it.size}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-slate-600">
              Geschat aantal dozen/tassen: <strong>{result.estimatedBoxes}</strong>
            </p>
            {result.specialItems.length > 0 && (
              <p className="mt-1 text-sm text-slate-600">
                Bijzondere items: {result.specialItems.join(", ")}
              </p>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Dit is een automatische indicatie op basis van foto-analyse en geen bindende offerte.
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {step < 2 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || submitting}
            className="text-sm text-slate-500 disabled:opacity-0"
          >
            ← Vorige
          </button>
          {step === 0 ? (
            <button
              onClick={() => setStep(1)}
              disabled={!step0Valid}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${fillClass}`}
              style={fillStyle}
            >
              Volgende
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting || photos.length === 0}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${fillClass} ${
                submitting ? "animate-pulse" : ""
              }`}
              style={fillStyle}
            >
              {submitting ? "AI analyseert de woning…" : "Prijsindicatie ophalen"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
