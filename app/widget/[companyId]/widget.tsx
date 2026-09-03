"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CompanyPublic = {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  phone: string | null;
};

type Photo = { id: string; file: Blob; url: string; room: string };

type PriceLine = { label: string; amountCents: number };
type InventoryItem = { name: string; quantity: number; volumeM3: number; category: string };

type Result = {
  inventory: InventoryItem[];
  totalVolumeM3: number;
  breakdown: PriceLine[];
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  emailSent: boolean;
};

const ROOM_SUGGESTIONS = [
  "Woonkamer",
  "Slaapkamer",
  "Keuken",
  "Badkamer",
  "Kinderkamer",
  "Kantoor",
  "Zolder",
  "Berging",
  "Garage",
  "Tuin",
];

const STEPS = ["Contact", "Adressen", "Foto's", "Opties", "Resultaat"];

const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const fmt = (cents: number) => euro.format((cents ?? 0) / 100);

async function downscale(file: File, maxSize = 1280, quality = 0.8): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", quality),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

export function Widget({ company }: { company: CompanyPublic }) {
  const [step, setStep] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  // Stap 0
  const [moveType, setMoveType] = useState<"verhuizing" | "ontruiming">("verhuizing");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Stap 1
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [fromFloor, setFromFloor] = useState("");
  const [toFloor, setToFloor] = useState("");
  const [moveDate, setMoveDate] = useState("");
  const [distanceKm, setDistanceKm] = useState("");

  // Stap 2
  const [rooms, setRooms] = useState<string[]>(["Woonkamer"]);
  const [customRoom, setCustomRoom] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);

  // Stap 3
  const [packing, setPacking] = useState(false);
  const [assembly, setAssembly] = useState(false);
  const [storageMonths, setStorageMonths] = useState("0");

  // Verzenden
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const accent = company.primaryColor;

  // Hoogte doorgeven aan de host-pagina (voor de <iframe> in embed.js)
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const post = () => {
      window.parent?.postMessage(
        { type: "verhuiswidget:height", id: company.id, height: el.scrollHeight },
        "*",
      );
    };
    post();
    const ro = new ResizeObserver(post);
    ro.observe(el);
    return () => ro.disconnect();
  }, [company.id, step, photos.length, result]);

  useEffect(() => {
    return () => photos.forEach((p) => URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addRoom = (room: string) => {
    const clean = room.trim();
    if (clean && !rooms.includes(clean)) setRooms((r) => [...r, clean]);
  };

  const removeRoom = (room: string) => {
    setRooms((r) => r.filter((x) => x !== room));
    setPhotos((ps) => {
      ps.filter((p) => p.room === room).forEach((p) => URL.revokeObjectURL(p.url));
      return ps.filter((p) => p.room !== room);
    });
  };

  const onFiles = useCallback(async (room: string, list: FileList | null) => {
    if (!list?.length) return;
    const incoming: Photo[] = [];
    for (const file of Array.from(list).slice(0, 8)) {
      const blob = await downscale(file);
      incoming.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: blob,
        url: URL.createObjectURL(blob),
        room,
      });
    }
    setPhotos((p) => [...p, ...incoming].slice(0, 14));
  }, []);

  const removePhoto = (id: string) => {
    setPhotos((ps) => {
      const target = ps.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return ps.filter((p) => p.id !== id);
    });
  };

  const stepValid = useMemo(() => {
    if (step === 0) return name.trim().length > 1 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    if (step === 2) return photos.length > 0;
    return true;
  }, [step, name, email, photos.length]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        companyId: company.id,
        moveType,
        customer: { name, email, phone },
        move: {
          fromAddress,
          toAddress,
          fromFloor,
          toFloor,
          moveDate,
          distanceKm: Number(distanceKm) || 0,
        },
        options: {
          packing,
          assembly,
          storageMonths: Number(storageMonths) || 0,
        },
        photoRooms: photos.map((p) => p.room),
      };

      const fd = new FormData();
      fd.append("payload", JSON.stringify(payload));
      photos.forEach((p, i) => fd.append("photos", p.file, `foto-${i + 1}.jpg`));

      const res = await fetch("/api/widget/submit", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Er ging iets mis.");

      setResult(data as Result);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

  return (
    <div ref={rootRef} className="mx-auto max-w-xl p-4 text-slate-900">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        {company.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logoUrl} alt={company.name} className="h-8 w-auto" />
        ) : (
          <span className="font-bold">{company.name}</span>
        )}
        <span className="text-sm text-slate-500">Offerte in 2 minuten</span>
      </div>

      {/* Voortgang */}
      {step < 4 && (
        <ol className="mb-6 flex gap-1">
          {STEPS.slice(0, 4).map((label, i) => (
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

      {/* Stap 0 — contact */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Wat wil je aanvragen?</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["verhuizing", "ontruiming"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setMoveType(t)}
                  className="rounded-lg border px-3 py-2 text-sm capitalize"
                  style={{
                    borderColor: moveType === t ? accent : "#cbd5e1",
                    background: moveType === t ? accent : "white",
                    color: moveType === t ? "white" : "#0f172a",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-medium">Naam *</span>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">E-mailadres *</span>
            <input
              className={inputCls}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Telefoonnummer</span>
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        </div>
      )}

      {/* Stap 1 — adressen */}
      {step === 1 && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Ophaaladres</span>
            <input
              className={inputCls}
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              placeholder="Straat, huisnummer, plaats"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium">Etage (van)</span>
              <input className={inputCls} value={fromFloor} onChange={(e) => setFromFloor(e.target.value)} placeholder="Bijv. begane grond" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Etage (naar)</span>
              <input className={inputCls} value={toFloor} onChange={(e) => setToFloor(e.target.value)} placeholder="Bijv. 2e met lift" />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium">Bezorgadres</span>
            <input
              className={inputCls}
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="Straat, huisnummer, plaats"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium">Gewenste datum</span>
              <input className={inputCls} type="date" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Afstand (km)</span>
              <input
                className={inputCls}
                inputMode="numeric"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Schatting"
              />
            </label>
          </div>
          <p className="text-xs text-slate-400">
            Weet je de afstand niet precies? Een schatting is prima — {company.name} controleert dit
            later.
          </p>
        </div>
      )}

      {/* Stap 2 — foto's */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Voeg per ruimte een paar foto's toe. Zorg dat de meubels goed zichtbaar zijn.
          </p>

          <div className="flex flex-wrap gap-1.5">
            {ROOM_SUGGESTIONS.filter((r) => !rooms.includes(r)).map((r) => (
              <button
                key={r}
                onClick={() => addRoom(r)}
                className="rounded-full border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-50"
              >
                + {r}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className={inputCls}
              value={customRoom}
              onChange={(e) => setCustomRoom(e.target.value)}
              placeholder="Andere ruimte…"
            />
            <button
              onClick={() => {
                addRoom(customRoom);
                setCustomRoom("");
              }}
              className="rounded-lg border border-slate-300 px-3 text-sm"
            >
              Toevoegen
            </button>
          </div>

          <div className="space-y-3">
            {rooms.map((room) => {
              const roomPhotos = photos.filter((p) => p.room === room);
              return (
                <div key={room} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">{room}</span>
                    <button
                      onClick={() => removeRoom(room)}
                      className="text-xs text-slate-400 hover:text-red-600"
                    >
                      Verwijderen
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {roomPhotos.map((p) => (
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
                    <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded border border-dashed border-slate-300 text-2xl text-slate-400 hover:bg-slate-50">
                      +
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          void onFiles(room, e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400">{photos.length} / 14 foto's</p>
        </div>
      )}

      {/* Stap 3 — opties */}
      {step === 3 && (
        <div className="space-y-3">
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
            <input type="checkbox" checked={packing} onChange={(e) => setPacking(e.target.checked)} className="mt-1" />
            <span>
              <span className="block text-sm font-medium">Inpakservice</span>
              <span className="block text-xs text-slate-500">
                Wij pakken je spullen in met verhuisdozen en inpakmateriaal.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
            <input type="checkbox" checked={assembly} onChange={(e) => setAssembly(e.target.checked)} className="mt-1" />
            <span>
              <span className="block text-sm font-medium">Meubelmontage en -demontage</span>
              <span className="block text-xs text-slate-500">
                Bedden, kasten en tafels worden uit elkaar gehaald en weer opgebouwd.
              </span>
            </span>
          </label>
          <label className="block rounded-lg border border-slate-200 p-3">
            <span className="block text-sm font-medium">Tijdelijke opslag</span>
            <span className="mb-2 block text-xs text-slate-500">
              Aantal maanden dat je spullen bij ons worden opgeslagen (0 = geen opslag).
            </span>
            <input
              className={inputCls}
              inputMode="numeric"
              value={storageMonths}
              onChange={(e) => setStorageMonths(e.target.value.replace(/[^0-9]/g, "") || "0")}
            />
          </label>
        </div>
      )}

      {/* Stap 4 — resultaat */}
      {step === 4 && result && (
        <div className="space-y-5">
          <div
            className="rounded-lg p-4 text-white"
            style={{ background: accent }}
          >
            <p className="text-sm opacity-90">Je offerte-indicatie</p>
            <p className="text-3xl font-bold">{fmt(result.totalCents)}</p>
            <p className="text-sm opacity-90">incl. btw · {result.totalVolumeM3.toFixed(1)} m³ inboedel</p>
          </div>

          <p className="text-sm text-slate-600">
            {result.emailSent
              ? `We hebben de offerte naar ${email} gestuurd. ${company.name} neemt binnenkort contact met je op.`
              : `Je aanvraag is ontvangen. ${company.name} neemt binnenkort contact met je op.`}
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
              {result.inventory.map((it, i) => (
                <li key={i} className="flex justify-between border-b border-slate-100 py-1">
                  <span>
                    {it.quantity}× {it.name}
                  </span>
                  <span>{(it.volumeM3 * it.quantity).toFixed(2)} m³</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-slate-400">
            Dit is een automatische indicatie op basis van foto-analyse en geen bindende offerte.
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {/* Navigatie */}
      {step < 4 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || submitting}
            className="text-sm text-slate-500 disabled:opacity-0"
          >
            ← Vorige
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!stepValid}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: accent }}
            >
              Volgende
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: accent }}
            >
              {submitting ? "Foto's analyseren…" : "Offerte aanvragen"}
            </button>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-[11px] text-slate-400">
        Mogelijk gemaakt door VerhuisWidget
      </p>
    </div>
  );
}
