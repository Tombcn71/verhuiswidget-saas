"use client";

import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Camera, DoorOpen, ImageIcon, MapPin, Minus, Plus } from "@/app/_components/icons";
import { Logo } from "@/app/_components/logo";
import { ROOM_PRESETS } from "./move-flow";

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

const STEPS = ["Foto's", "Gegevens", "Resultaat"];

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
  showToggle,
  moveType,
  setMoveType,
  step,
  setStep,
}: {
  company: CompanyPublic;
  demo: boolean;
  showToggle: boolean;
  moveType: "verhuizing" | "ontruiming";
  setMoveType: (t: "verhuizing" | "ontruiming") => void;
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
}) {
  const accent = company.primaryColor;
  const fillClass = demo ? AI_GRADIENT : "";
  const fillStyle = demo ? undefined : { background: accent };

  const [name, setName] = useState(demo ? "Demo Gebruiker" : "");
  const [email, setEmail] = useState(demo ? "demo@voorbeeld.nl" : "");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [areaM2, setAreaM2] = useState("");
  const [floor, setFloor] = useState("0");
  const [hasLift, setHasLift] = useState(false);
  const [works, setWorks] = useState<Record<string, boolean>>({});
  const [photos, setPhotos] = useState<{ id: string; file: Blob; url: string; room: string }[]>([]);
  const [photoMethod, setPhotoMethod] = useState<"camera" | "gallery" | null>(null);
  const [customRooms, setCustomRooms] = useState<string[]>([]);
  const [showCustomRoom, setShowCustomRoom] = useState(false);
  const [customRoomName, setCustomRoomName] = useState("");
  const pendingRoomRef = useRef<string>("Algemeen");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClearResult | null>(null);

  const inputCls =
    "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5";

  const photosValid = photos.length > 0;
  const gegevensValid =
    name.trim().length > 1 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) &&
    Number(areaM2) > 0;

  const onFiles = useCallback(async (room: string, list: FileList | null) => {
    if (!list?.length) return;
    const incoming: { id: string; file: Blob; url: string; room: string }[] = [];
    for (const file of Array.from(list).slice(0, 10)) {
      const blob = await downscale(file);
      incoming.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: blob,
        url: URL.createObjectURL(blob),
        room,
      });
    }
    setPhotos((p) => [...p, ...incoming].slice(0, 10));
  }, []);

  const openRoomPicker = (room: string) => {
    pendingRoomRef.current = room;
    fileInputRef.current?.click();
  };

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

  const toggle = showToggle && (
    <div className="inline-flex rounded-full border border-slate-200 p-1 text-xs">
      {(["verhuizing", "ontruiming"] as const).map((t) => (
        <button
          key={t}
          onClick={() => setMoveType(t)}
          className={`rounded-full px-3 py-1 capitalize ${
            moveType === t ? `${AI_GRADIENT} text-white` : "text-slate-500"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );

  const stepperControl = (value: string, onChange: (v: string) => void, min = 0) => {
    const n = Number(value) || 0;
    return (
      <div className="mt-2 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => onChange(String(Math.max(min, n - 1)))}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center text-xl font-bold">{n}</span>
        <button
          type="button"
          onClick={() => onChange(String(n + 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const toggleSwitch = (value: boolean, onChange: (v: boolean) => void, offLabel: string, onLabel: string) => (
    <div className="mt-2 flex items-center justify-center gap-3">
      <span className={`text-sm ${!value ? "font-semibold text-slate-900" : "text-slate-400"}`}>{offLabel}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-pressed={value}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${value ? AI_GRADIENT : "bg-slate-200"}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
            value ? "left-5.5" : "left-0.5"
          }`}
        />
      </button>
      <span className={`text-sm ${value ? "font-semibold text-slate-900" : "text-slate-400"}`}>{onLabel}</span>
    </div>
  );

  const roomPickerOpen = photoMethod !== null;

  // --- Stap 0: foto's (demo — grote koptekst, kaarten zonder achtergrond op het icoon) ---
  const fancyFotosBody = (
    <>
      <div className="text-center">
        {!roomPickerOpen ? (
          <>
            <h2 className="text-3xl font-bold tracking-tight">
              <span className="bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Scan
              </span>{" "}
              je woning
            </h2>
            <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
              Maak per kamer een foto, of kies bestaande foto&apos;s uit je gallerij.
            </p>
          </>
        ) : (
          <>
            <button
              onClick={() => setPhotoMethod(null)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              ‹ Andere methode
            </button>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Welke{" "}
              <span className="bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                ruimte
              </span>{" "}
              begin je?
            </h2>
            <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
              Maak foto&apos;s kamer voor kamer, je kan altijd terug om meer toe te voegen.
            </p>
          </>
        )}
      </div>

      {showToggle && !roomPickerOpen && (
        <div className="mt-10 flex justify-center">{toggle}</div>
      )}

      <div className="mt-10">
        {!roomPickerOpen ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPhotoMethod("camera")}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-5 text-center hover:bg-slate-50"
            >
              <Camera className="h-10 w-10 text-slate-700" />
              <span className="text-sm font-semibold">Camera</span>
            </button>
            <button
              onClick={() => setPhotoMethod("gallery")}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-5 text-center hover:bg-slate-50"
            >
              <ImageIcon className="h-10 w-10 text-slate-700" />
              <span className="text-sm font-semibold">Gallerij</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                ...ROOM_PRESETS,
                ...customRooms.map((label) => ({ label, Icon: DoorOpen })),
              ].map(({ label, Icon }) => {
                const count = photos.filter((p) => p.room === label).length;
                return (
                  <button
                    key={label}
                    onClick={() => openRoomPicker(label)}
                    className="relative flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 p-3 text-center hover:bg-slate-50"
                  >
                    {count > 0 && (
                      <span
                        className={`absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-white ${AI_GRADIENT}`}
                      >
                        {count}
                      </span>
                    )}
                    <Icon className="h-6 w-6 text-slate-500" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                );
              })}
            </div>

            {showCustomRoom ? (
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  value={customRoomName}
                  onChange={(e) => setCustomRoomName(e.target.value)}
                  placeholder="Naam van de ruimte…"
                />
                <button
                  onClick={() => {
                    const clean = customRoomName.trim();
                    if (clean && !customRooms.includes(clean)) setCustomRooms((r) => [...r, clean]);
                    setCustomRoomName("");
                    setShowCustomRoom(false);
                  }}
                  className="rounded-lg border border-slate-300 px-3 text-sm"
                >
                  Toevoegen
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomRoom(true)}
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                + Aangepaste ruimte toevoegen
              </button>
            )}

            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" className="h-16 w-16 rounded object-cover" />
                    <button
                      onClick={() => removePhoto(p.id)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400">{photos.length} / 10 foto&apos;s</p>
          </div>
        )}
      </div>
    </>
  );

  // --- Stap 0: foto's (echte widget — compact, geen grote kop) ---
  const plainFotosBody = (
    <div className="space-y-4">
      {showToggle && <div className="flex justify-center">{toggle}</div>}
      <p className="text-sm text-slate-600">
        Upload foto&apos;s van de woning. Maak per kamer één overzichtsfoto — dan kan de AI de
        vulgraad goed inschatten.
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
              void onFiles("Algemeen", e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="text-xs text-slate-400">{photos.length} / 10 foto&apos;s · minimaal 1</p>
    </div>
  );

  // --- Stap 1: gegevens ---
  const gegevensBody = (
    <div className="space-y-5">
      {demo && (
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Jouw{" "}
            <span className="bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              gegevens
            </span>
          </h2>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Postcode</span>
          <div className="relative mt-1">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} pl-11`} value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Bijv. 3000 AB" />
          </div>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Oppervlak (m²) *</span>
          <input
            className={`${inputCls} mt-1`}
            inputMode="numeric"
            value={areaM2}
            onChange={(e) => setAreaM2(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Bijv. 75"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold">Woningtype</span>
        <select className={`${inputCls} mt-2`} value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
          <option value="">Selecteer type</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>

      <div>
        <p className="text-sm font-semibold">Verdieping</p>
        {stepperControl(floor, setFloor)}
      </div>

      {Number(floor) > 0 && (
        <div>
          <p className="text-sm font-semibold">Is er een lift?</p>
          {toggleSwitch(hasLift, setHasLift, "Nee", "Ja")}
        </div>
      )}

      <div>
        <p className="text-sm font-semibold">Extra werkzaamheden (optioneel)</p>
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
        <input className={`${inputCls} mt-1`} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">E-mailadres *</span>
        <input className={`${inputCls} mt-1`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Telefoonnummer</span>
        <input className={`${inputCls} mt-1`} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
    </div>
  );

  // --- Stap 2: resultaat ---
  const resultaatBody = result && (
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
  );

  const hiddenFileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      capture={photoMethod === "camera" ? "environment" : undefined}
      multiple
      className="hidden"
      onChange={(e) => {
        void onFiles(pendingRoomRef.current, e.target.files);
        e.target.value = "";
      }}
    />
  );

  if (demo) {
    return (
      <div className="flex h-dvh flex-col bg-white px-5 py-6 text-slate-900">
        {hiddenFileInput}

        {/* Topbalk */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            aria-label="Terug"
            disabled={step === 0}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 disabled:opacity-0"
          >
            ←
          </button>
          <Logo className="text-base" />
          <span className="h-9 w-9" />
        </div>

        {/* Stapteller */}
        {step < 2 && (
          <div className="mt-5 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Stap {step + 1} van {STEPS.length - 1}
            </span>
            <div className="flex gap-1.5">
              {STEPS.slice(0, 2).map((label, i) => (
                <span
                  key={label}
                  className={`h-2 w-2 rounded-full ${i <= step ? AI_GRADIENT : ""}`}
                  style={{ background: i <= step ? undefined : "#e2e8f0" }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pb-4 pt-10">
          {step === 0 && fancyFotosBody}
          {step === 1 && gegevensBody}
          {step === 2 && resultaatBody}
        </div>

        {error && (
          <p className="mb-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        {step < 2 && (
          <button
            onClick={step === 0 ? () => setStep(1) : submit}
            disabled={step === 0 ? !photosValid : submitting || !gegevensValid}
            className={`rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-40 ${AI_GRADIENT} ${
              submitting ? "animate-pulse" : ""
            }`}
          >
            {step === 0 ? "Volgende" : submitting ? "AI analyseert de woning…" : "Prijsindicatie ophalen"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Voortgang */}
      {step < 2 && (
        <ol className="mb-6 flex gap-1">
          {STEPS.slice(0, 2).map((label, i) => (
            <li key={label} className="flex-1">
              <div
                className="h-1.5 rounded-full"
                style={{ background: i <= step ? accent : "#e2e8f0" }}
              />
              <span className="mt-1 block text-[11px] text-slate-500">{label}</span>
            </li>
          ))}
        </ol>
      )}

      {step === 0 && (
        <>
          {hiddenFileInput}
          {plainFotosBody}
        </>
      )}
      {step === 1 && gegevensBody}
      {step === 2 && resultaatBody}

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
              disabled={!photosValid}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${fillClass}`}
              style={fillStyle}
            >
              Volgende
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting || !gegevensValid}
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
