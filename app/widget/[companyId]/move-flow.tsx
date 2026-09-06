"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  Bath,
  Bed,
  Briefcase,
  Building,
  Camera,
  DoorOpen,
  Home,
  ImageIcon,
  MapPin,
  Minus,
  Plus,
  Sofa,
  Table,
  Utensils,
} from "@/app/_components/icons";
import { FLOOR_TYPES } from "@/lib/pricing";
import { upload } from "@vercel/blob/client";
import { Logo } from "@/app/_components/logo";

export const ROOM_PRESETS: { label: string; Icon: typeof Sofa }[] = [
  { label: "Woonkamer", Icon: Sofa },
  { label: "Keuken", Icon: Utensils },
  { label: "Slaapkamer", Icon: Bed },
  { label: "Badkamer", Icon: Bath },
  { label: "Eetkamer", Icon: Table },
  { label: "Kantoor", Icon: Briefcase },
];

type CompanyPublic = {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
};

type Photo = { id: string; file: Blob; url: string; room: string; blobUrl?: string };

type PriceLine = { label: string; amountCents: number };
type InventoryItem = {
  name: string;
  quantity: number;
  volumeM3: number;
  category: string;
  room?: string;
  x?: number;
  y?: number;
  needsInfo?: boolean;
};

type Result = {
  demo?: boolean;
  inventory: InventoryItem[];
  totalVolumeM3: number;
  breakdown: PriceLine[];
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  emailSent: boolean;
};

const STEPS = ["Foto's", "Inventaris", "Adressen", "Opties", "Contact", "Resultaat"];
const LAST_INPUT_STEP = 4; // Contact — daarna volgt de offerte
const RESULT_STEP = 5;

const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const fmt = (cents: number) => euro.format((cents ?? 0) / 100);
const AI_GRADIENT = "bg-linear-to-br from-blue-600 via-indigo-600 to-violet-600";

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

export function MoveFlow({
  company,
  demo,
  showToggle,
  moveType,
  setMoveType,
  step,
  setStep,
  onBackToIntro,
  preview = false,
}: {
  company: CompanyPublic;
  demo: boolean;
  showToggle: boolean;
  moveType: "verhuizing" | "ontruiming";
  setMoveType: (t: "verhuizing" | "ontruiming") => void;
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
  onBackToIntro?: () => void;
  preview?: boolean;
}) {
  // Stap 1 — contact
  const [name, setName] = useState(demo ? "Demo Gebruiker" : "");
  const [email, setEmail] = useState(demo ? "demo@voorbeeld.nl" : "");
  const [phone, setPhone] = useState("");

  // Stap 2 — adressen
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [propertyType, setPropertyType] = useState<"huis" | "appartement">("huis");
  const [fromFloor, setFromFloor] = useState("");
  const [moveDate, setMoveDate] = useState("");
  const [roomCount, setRoomCount] = useState("1");
  const [hasElevator, setHasElevator] = useState(false);
  const [streetAccessible, setStreetAccessible] = useState(true);

  // Stap 0 — foto's
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoMethod, setPhotoMethod] = useState<"camera" | "gallery" | null>(null);
  const [customRooms, setCustomRooms] = useState<string[]>([]);
  const [showCustomRoom, setShowCustomRoom] = useState(false);
  const [customRoomName, setCustomRoomName] = useState("");
  const pendingRoomRef = useRef<string>("Algemeen");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stap 1 — inventaris-review
  const [analyzing, setAnalyzing] = useState(false);
  const [roomInventory, setRoomInventory] = useState<
    { name: string; photoCount: number; items: InventoryItem[] }[] | null
  >(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [newItemFor, setNewItemFor] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");

  // Stap 3 — opties (verhuizen)
  const [packing, setPacking] = useState(false);
  const [assembly, setAssembly] = useState(false);
  const [storageMonths, setStorageMonths] = useState("0");

  // Stap 3 — extra werkzaamheden (ontruiming)
  const [floorRemoval, setFloorRemoval] = useState(false);
  const [floorType, setFloorType] = useState("laminaat");
  const [floorRemovalM2, setFloorRemovalM2] = useState("");
  const [wallpaper, setWallpaper] = useState(false);
  const [wallpaperM2, setWallpaperM2] = useState("");
  const [holesOn, setHolesOn] = useState(false);
  const [holes, setHoles] = useState("");
  const [painting, setPainting] = useState(false);
  const [paintingM2, setPaintingM2] = useState("");
  const [curtains, setCurtains] = useState(false);

  const isClearance = moveType === "ontruiming";

  // Verzenden
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const accent = company.primaryColor;
  const fillClass = demo ? AI_GRADIENT : "";
  const fillStyle = demo ? undefined : { background: accent };

  useEffect(() => {
    return () => photos.forEach((p) => URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFiles = useCallback(
    async (room: string, list: FileList | null) => {
      if (!list?.length) return;
      const incoming: Photo[] = [];
      for (const file of Array.from(list).slice(0, 14)) {
        const blob = await downscale(file);
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const photo: Photo = { id, file: blob, url: URL.createObjectURL(blob), room };
        // Echte aanvraag: foto direct naar Vercel Blob (buiten de serverless-limiet om).
        if (!demo && !preview) {
          try {
            const res = await upload(`widget/${company.id}/${id}.jpg`, blob, {
              access: "public",
              handleUploadUrl: "/api/widget/blob-upload",
            });
            photo.blobUrl = res.url;
          } catch {
            // geen blob-token / upload mislukt — ga door zonder opgeslagen foto
          }
        }
        incoming.push(photo);
      }
      setPhotos((p) => [...p, ...incoming].slice(0, 14));
    },
    [demo, preview, company.id],
  );

  const openRoomPicker = (room: string) => {
    pendingRoomRef.current = room;
    fileInputRef.current?.click();
  };

  const removePhoto = (id: string) => {
    setPhotos((ps) => {
      const target = ps.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return ps.filter((p) => p.id !== id);
    });
  };

  const stepValid = useMemo(() => {
    if (step === 0) return photos.length > 0;
    if (step === LAST_INPUT_STEP)
      return name.trim().length > 1 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    return true;
  }, [step, name, email, photos.length]);

  const flatInventory = useMemo<InventoryItem[]>(
    () =>
      (roomInventory ?? []).flatMap((r) =>
        r.items.map((it) => ({ ...it, room: r.name })),
      ),
    [roomInventory],
  );

  async function analyzeAndContinue() {
    setAnalyzing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("companyId", company.id);
      if (preview) fd.append("preview", "1");
      photos.forEach((p, i) => {
        // Blob-URL als die er is (echte aanvraag), anders het bestand (demo/preview).
        if (p.blobUrl) fd.append("photoUrls", p.blobUrl);
        else fd.append("photos", p.file, `foto-${i + 1}.jpg`);
        fd.append("photoRooms", p.room);
      });
      const res = await fetch("/api/widget/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "De analyse is mislukt.");
      setRoomInventory(data.rooms as typeof roomInventory);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis.");
    } finally {
      setAnalyzing(false);
    }
  }

  const adjustItem = (roomName: string, index: number, delta: number) => {
    setRoomInventory((rooms) =>
      (rooms ?? []).map((r) =>
        r.name !== roomName
          ? r
          : {
              ...r,
              items: r.items
                .map((it, i) => (i === index ? { ...it, quantity: it.quantity + delta } : it))
                .filter((it) => it.quantity > 0),
            },
      ),
    );
  };

  const addItem = (roomName: string, itemName: string) => {
    const clean = itemName.trim();
    if (!clean) return;
    setRoomInventory((rooms) =>
      (rooms ?? []).map((r) =>
        r.name !== roomName
          ? r
          : {
              ...r,
              items: [...r.items, { name: clean, quantity: 1, volumeM3: 0.3, category: "overig" }],
            },
      ),
    );
  };

  const addRoom = (roomName: string) => {
    const clean = roomName.trim();
    if (!clean) return;
    setRoomInventory((rooms) => {
      const list = rooms ?? [];
      if (list.some((r) => r.name.toLowerCase() === clean.toLowerCase())) return list;
      return [...list, { name: clean, photoCount: 0, items: [] }];
    });
  };

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const photoRooms = (roomInventory ?? []).flatMap((r) =>
        Array.from({ length: Math.max(1, r.photoCount) }, () => r.name),
      );
      const photoUrls = photos.map((p) => p.blobUrl).filter((u): u is string => !!u);
      const details = {
        address: fromAddress,
        propertyType,
        floor: Number(fromFloor) || 0,
        roomCount: Number(roomCount) || 0,
        hasElevator,
        streetAccessible,
        moveDate,
      };

      const payload = isClearance
        ? {
            companyId: company.id,
            customer: { name, email, phone },
            details,
            works: {
              floorRemoval: floorRemoval
                ? { type: floorType, m2: Number(floorRemovalM2) || 0 }
                : null,
              wallpaperM2: wallpaper ? Number(wallpaperM2) || 0 : 0,
              holes: holesOn ? Number(holes) || 0 : 0,
              paintingM2: painting ? Number(paintingM2) || 0 : 0,
              curtains,
              packing,
            },
            photoRooms,
            photoUrls,
            inventory: flatInventory,
          }
        : {
            companyId: company.id,
            moveType,
            customer: { name, email, phone },
            move: {
              fromAddress,
              toAddress,
              fromFloor,
              toFloor: "",
              propertyType,
              roomCount: Number(roomCount) || 0,
              hasElevator,
              streetAccessible,
              moveDate,
              distanceKm: 0,
            },
            options: {
              packing,
              assembly,
              storageMonths: Number(storageMonths) || 0,
            },
            photoRooms,
            photoUrls,
            inventory: flatInventory,
          };

      const fd = new FormData();
      fd.append("payload", JSON.stringify(payload));
      if (preview) fd.append("preview", "1");

      const url = isClearance ? "/api/widget/clearance" : "/api/widget/submit";
      const res = await fetch(url, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Er ging iets mis.");

      setResult(data as Result);
      setStep(RESULT_STEP);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5";

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

  // --- Stap 0: foto's (versie voor de demo — grote koptekst, kaarten zonder achtergrond op het icoon) ---
  const fancyFotosBody = (
    <>
      <div className="text-center">
        {!roomPickerOpen ? (
          <>
            <h2 className="text-3xl font-bold tracking-tight">
              <span className="bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Scan
              </span>{" "}
              je {isClearance ? "woning" : "ruimtes"}
            </h2>
            <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
              Maak foto&apos;s terwijl je door je huis loopt, of kies bestaande foto&apos;s uit je
              gallerij.
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
        <div className="mt-10 flex justify-center">
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
        </div>
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
            <p className="text-xs text-slate-400">{photos.length} / 14 foto&apos;s</p>
          </div>
        )}
      </div>
    </>
  );

  // --- Stap 0: foto's (versie voor het echte, brandbare widget — compacter, geen grote kop) ---
  const plainFotosBody = (
    <div className="space-y-4">
      {showToggle && (
        <div>
          <label className="text-sm font-medium">Wat wil je aanvragen?</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["verhuizing", "ontruiming"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setMoveType(t)}
                className={`rounded-lg border px-3 py-2 text-sm capitalize ${
                  moveType === t && demo ? `${AI_GRADIENT} border-transparent text-white` : ""
                }`}
                style={{
                  borderColor: moveType === t ? (demo ? undefined : accent) : "#cbd5e1",
                  background: moveType === t ? (demo ? undefined : accent) : "white",
                  color: moveType === t ? (demo ? undefined : "white") : "#0f172a",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {photoMethod === null ? (
        <>
          <p className="text-sm text-slate-600">
            Maak foto&apos;s van alle ruimtes in huis, of kies bestaande foto&apos;s uit je
            gallerij. Zorg dat de meubels goed zichtbaar zijn — onze AI herkent hier direct je
            inboedel mee.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPhotoMethod("camera")}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-5 text-center hover:bg-slate-50"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full text-white ${fillClass}`}
                style={fillStyle}
              >
                <Camera className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold">Camera</span>
              <span className="text-xs text-slate-500">Maak foto&apos;s terwijl je door je huis loopt</span>
            </button>
            <button
              onClick={() => setPhotoMethod("gallery")}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-5 text-center hover:bg-slate-50"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full text-white ${fillClass}`}
                style={fillStyle}
              >
                <ImageIcon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold">Gallerij</span>
              <span className="text-xs text-slate-500">Upload foto&apos;s die je al hebt</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Welke ruimte nu?</p>
            <button
              onClick={() => setPhotoMethod(null)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              ‹ Andere methode
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Leg elke ruimte apart vast. Je kunt later nog ruimtes of foto&apos;s toevoegen.
          </p>

          <div className="grid grid-cols-3 gap-2">
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
                      className={`absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-white ${fillClass}`}
                      style={fillStyle}
                    >
                      {count}
                    </span>
                  )}
                  <Icon className="h-5 w-5 text-slate-500" />
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
          <p className="text-xs text-slate-400">{photos.length} / 14 foto&apos;s</p>
        </>
      )}
    </div>
  );

  // --- Stap 1: contact ---
  const contactBody = (
    <div className="space-y-4">
      {demo && (
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Jouw{" "}
            <span className="bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              gegevens
            </span>
          </h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
            Vul je naam en e-mail in — je prijsindicatie verschijnt op het scherm en komt ook in je
            mailbox.
          </p>
        </div>
      )}
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
  );

  // --- Stap 1: inventaris-review ---
  const inventarisBody = (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Check je{" "}
          <span className="bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            inboedel
          </span>
        </h2>
        <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
          Onze AI herkende dit. Pas aantallen aan of voeg ontbrekende spullen toe. Kleine losse
          spullen hoef je niet te noemen — die zitten in de doos-inschatting.
        </p>
      </div>

      {(roomInventory ?? []).map((room) => {
        const roomPhotos = photos.filter((p) => p.room === room.name);
        return (
        <div key={room.name} className="overflow-hidden rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 p-3">
            {roomPhotos[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={roomPhotos[0].url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{room.name}</p>
              <p className="text-xs text-slate-400">
                {roomPhotos.length > 0 &&
                  `${roomPhotos.length} foto${roomPhotos.length > 1 ? "'s" : ""} · `}
                {room.items.reduce((n, it) => n + it.quantity, 0)} items
              </p>
            </div>
          </div>

          {roomPhotos[0] && (
            <div className="relative bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={roomPhotos[0].url} alt={`Foto ${room.name}`} className="w-full object-cover" />
              {room.items
                .filter((it) => typeof it.x === "number" && typeof it.y === "number")
                .map((it, i) => (
                  <span
                    key={i}
                    className={`absolute -translate-x-1/2 -translate-y-full rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow ${AI_GRADIENT}`}
                    style={{ left: `${(it.x ?? 0.5) * 100}%`, top: `${(it.y ?? 0.5) * 100}%` }}
                  >
                    {it.name}
                  </span>
                ))}
            </div>
          )}

          <div className="space-y-2 p-4">
            {room.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-sm">
                  {it.name}
                  {it.needsInfo && (
                    <span className="ml-1 text-xs text-amber-600">· check</span>
                  )}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => adjustItem(room.name, i, -1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">{it.quantity}</span>
                  <button
                    type="button"
                    onClick={() => adjustItem(room.name, i, 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {newItemFor === room.name ? (
              <div className="flex gap-2 pt-1">
                <input
                  className={inputCls}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Naam van het item…"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    addItem(room.name, newItemName);
                    setNewItemName("");
                    setNewItemFor(null);
                  }}
                  className="rounded-lg border border-slate-300 px-3 text-sm"
                >
                  Toevoegen
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setNewItemFor(room.name)}
                className="pt-1 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                + Ontbrekend item toevoegen
              </button>
            )}
          </div>
        </div>
        );
      })}

      <div className="flex gap-2">
        <input
          className={inputCls}
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="Kamer toevoegen (bijv. zolder)…"
        />
        <button
          type="button"
          onClick={() => {
            addRoom(newRoomName);
            setNewRoomName("");
          }}
          className="rounded-lg border border-slate-300 px-3 text-sm"
        >
          Toevoegen
        </button>
      </div>
    </div>
  );

  // --- Stap 2: adressen ---
  const adressenBody = (
    <div className="space-y-5">
      {demo && (
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            {isClearance ? "Waar is de " : "Waar ga je "}
            <span className="bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              {isClearance ? "ontruiming" : "naartoe"}
            </span>
            ?
          </h2>
        </div>
      )}
      <div>
        {!demo && (
          <p className="text-sm font-semibold">
            {isClearance ? "Wat is het ontruimadres?" : "Waar ga je naartoe verhuizen?"}
          </p>
        )}
        <div className={`space-y-3 ${demo ? "" : "mt-2"}`}>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">
              {isClearance ? "Ontruimadres" : "Ophaaladres"}
            </span>
            <div className="relative mt-1">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputCls} pl-11`}
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
                placeholder="Straat, huisnummer, postcode, plaats"
              />
            </div>
          </label>
          {!isClearance && (
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Bezorgadres</span>
              <div className="relative mt-1">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className={`${inputCls} pl-11`}
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="Straat, huisnummer, postcode, plaats"
                />
              </div>
            </label>
          )}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold">Wat voor soort woning heb je?</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {(
            [
              { key: "huis", label: "Huis", Icon: Home },
              { key: "appartement", label: "Appartement", Icon: Building },
            ] as const
          ).map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setPropertyType(key)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-center text-slate-700 transition ${
                propertyType === key ? "border-slate-900" : "border-slate-200"
              }`}
            >
              <Icon className="h-8 w-8" />
              <span className="text-sm font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-semibold">
          {isClearance ? "Wanneer wil je de ontruiming?" : "Wanneer ga je verhuizen?"}
        </span>
        <input className={`${inputCls} mt-2`} type="date" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} />
      </label>

      <div>
        <p className="text-sm font-semibold">Etage</p>
        {stepperControl(fromFloor, setFromFloor)}
      </div>

      <div>
        <p className="text-sm font-semibold">Hoeveel kamers heb je?</p>
        <p className="mt-1 text-xs text-slate-500">
          Een kamer is elke ruimte in je huis: keuken, woonkamer, slaapkamer… Reken op één of twee
          foto&apos;s per kamer.
        </p>
        {stepperControl(roomCount, setRoomCount, 1)}
      </div>

      <div>
        <p className="text-sm font-semibold">Is er een lift?</p>
        {toggleSwitch(hasElevator, setHasElevator, "Nee", "Ja")}
      </div>

      <div>
        <p className="text-sm font-semibold">Is je woning bereikbaar vanaf de straat?</p>
        <p className="mt-1 text-xs text-slate-500">
          Staat je huis direct aan de straat of juist inpandig? Kan een verhuiswagen er parkeren,
          of is het een voetgangersgebied?
        </p>
        {toggleSwitch(streetAccessible, setStreetAccessible, "Nee", "Ja")}
      </div>
    </div>
  );

  // --- Stap 3: opties ---
  const optiesBody = (
    <div className="space-y-3">
      {demo && (
        <div className="mb-2 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Nog wat{" "}
            <span className="bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              extra&apos;s
            </span>
            ?
          </h2>
        </div>
      )}

      {isClearance ? (
        <>
          {/* Vloer verwijderen — met vloertype */}
          <div className="rounded-lg border border-slate-200 p-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={floorRemoval}
                onChange={(e) => setFloorRemoval(e.target.checked)}
              />
              <span className="text-sm font-medium">Vloer verwijderen</span>
            </label>
            {floorRemoval && (
              <div className="mt-3 space-y-2">
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Type vloer</span>
                  <select
                    className={`${inputCls} mt-1`}
                    value={floorType}
                    onChange={(e) => setFloorType(e.target.value)}
                  >
                    {FLOOR_TYPES.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500">Oppervlak</span>
                  <div className="flex items-center gap-2">
                    <input
                      className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-right text-sm outline-none focus:border-slate-900"
                      inputMode="numeric"
                      value={floorRemovalM2}
                      onChange={(e) => setFloorRemovalM2(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="0"
                    />
                    <span className="w-8 text-xs text-slate-500">m²</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Overige werkzaamheden */}
          {(
            [
              { label: "Behang verwijderen", unit: "m²", on: wallpaper, setOn: setWallpaper, value: wallpaperM2, set: setWallpaperM2 },
              { label: "Gaatjes stoppen", unit: "stuks", on: holesOn, setOn: setHolesOn, value: holes, set: setHoles },
              { label: "Schilderwerk", unit: "m²", on: painting, setOn: setPainting, value: paintingM2, set: setPaintingM2 },
            ] as const
          ).map(({ label, unit, on, setOn, value, set }) => (
            <div key={label} className="rounded-lg border border-slate-200 p-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />
                <span className="text-sm font-medium">{label}</span>
              </label>
              {on && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500">
                    {unit === "stuks" ? "Aantal" : "Oppervlak"}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-right text-sm outline-none focus:border-slate-900"
                      inputMode="numeric"
                      value={value}
                      onChange={(e) => set(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="0"
                    />
                    <span className="w-8 text-xs text-slate-500">{unit}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
            <input type="checkbox" checked={curtains} onChange={(e) => setCurtains(e.target.checked)} />
            <span className="text-sm font-medium">Gordijnen verwijderen</span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
            <input type="checkbox" checked={packing} onChange={(e) => setPacking(e.target.checked)} className="mt-1" />
            <span>
              <span className="block text-sm font-medium">Inpakservice</span>
              <span className="block text-xs text-slate-500">
                Wij pakken de losse spullen in met dozen en inpakmateriaal.
              </span>
            </span>
          </label>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );

  // --- Stap 4: resultaat ---
  const resultaatBody = result && (
    <div className="space-y-5">
      <div className={`rounded-lg p-4 text-white ${fillClass}`} style={fillStyle}>
        <p className="text-sm opacity-90">Je offerte-indicatie</p>
        <p className="text-3xl font-bold">{fmt(result.totalCents)}</p>
        <p className="text-sm opacity-90">incl. btw · {result.totalVolumeM3.toFixed(1)} m³ inboedel</p>
      </div>

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

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-sm font-semibold">Je offerte is verzonden ✓</p>
        <p className="mt-1 text-xs text-slate-500">
          {result.emailSent
            ? `De offerte staat nu in je mailbox (${email}). ${company.name} neemt binnenkort contact met je op.`
            : `Je aanvraag is ontvangen. ${company.name} neemt binnenkort contact met je op.`}
        </p>
      </div>
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

  const nextLabel =
    step === 0 ? "Volgende" : step === 1 ? "Bevestigen" : step === LAST_INPUT_STEP ? "Ontvang je offerte" : "Volgende";

  const onNext = () => {
    if (step === 0) return void analyzeAndContinue();
    if (step === LAST_INPUT_STEP) return void submit();
    setStep((s) => s + 1);
  };

  if (demo) {
    if (analyzing) {
      return (
        <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-white px-5 text-center text-slate-900">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white ${AI_GRADIENT} animate-pulse`}
          >
            <ImageIcon className="h-7 w-7" />
          </div>
          <p className="text-lg font-semibold">AI analyseert je foto&apos;s…</p>
          <p className="max-w-xs text-sm text-slate-500">
            We herkennen je meubels en stellen een inventarislijst samen. Dit duurt een paar
            seconden.
          </p>
        </div>
      );
    }

    return (
      <div className="flex h-dvh flex-col bg-white px-5 py-6 text-slate-900">
        {hiddenFileInput}

        {/* Topbalk */}
        <div className="flex items-center justify-between">
          <button
            onClick={step === 0 ? onBackToIntro : () => setStep((s) => Math.max(0, s - 1))}
            aria-label="Terug"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700"
          >
            ←
          </button>
          <Logo className="text-base" />
          <span className="h-9 w-9" />
        </div>

        {/* Stapteller */}
        {step < RESULT_STEP && (
          <div className="mt-5 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Stap {step + 1} van {STEPS.length - 1}
            </span>
            <div className="flex gap-1.5">
              {STEPS.slice(0, STEPS.length - 1).map((label, i) => (
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
          {step === 1 && inventarisBody}
          {step === 2 && adressenBody}
          {step === 3 && optiesBody}
          {step === LAST_INPUT_STEP && contactBody}
          {step === RESULT_STEP && resultaatBody}
        </div>

        {error && (
          <p className="mb-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        {step < RESULT_STEP && (
          <button
            onClick={onNext}
            disabled={!stepValid || submitting}
            className={`rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-40 ${AI_GRADIENT} ${
              submitting ? "animate-pulse" : ""
            }`}
          >
            {submitting ? "Offerte wordt berekend…" : nextLabel}
          </button>
        )}
      </div>
    );
  }

  if (analyzing) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${fillClass} animate-pulse`} style={fillStyle}>
          <ImageIcon className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold">AI analyseert je foto&apos;s…</p>
        <p className="max-w-xs text-xs text-slate-500">Een paar seconden geduld.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Voortgang */}
      {step < RESULT_STEP && (
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            Stap {step + 1} van {STEPS.length - 1}
          </span>
          <div className="flex gap-1.5">
            {STEPS.slice(0, STEPS.length - 1).map((label, i) => (
              <span
                key={label}
                className="h-2 w-2 rounded-full"
                style={{ background: i <= step ? accent : "#e2e8f0" }}
              />
            ))}
          </div>
        </div>
      )}

      {step === 0 && (
        <>
          {hiddenFileInput}
          {plainFotosBody}
        </>
      )}
      {step === 1 && inventarisBody}
      {step === 2 && adressenBody}
      {step === 3 && optiesBody}
      {step === LAST_INPUT_STEP && contactBody}
      {step === RESULT_STEP && resultaatBody}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {/* Navigatie */}
      {step < RESULT_STEP && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || submitting}
            className="text-sm text-slate-500 disabled:opacity-0"
          >
            ← Vorige
          </button>
          <button
            onClick={onNext}
            disabled={!stepValid || submitting}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${fillClass} ${
              submitting ? "animate-pulse" : ""
            }`}
            style={fillStyle}
          >
            {submitting ? "Offerte wordt berekend…" : nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}
