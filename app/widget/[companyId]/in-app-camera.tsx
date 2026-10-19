"use client";

import { useEffect, useRef, useState } from "react";

/** Of deze browser een camera in de pagina kan tonen (HTTPS + getUserMedia). */
export function canUseInAppCamera(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== "undefined" &&
    window.isSecureContext
  );
}

/**
 * Camera ín de widget (getUserMedia) in plaats van de camera-app van de
 * telefoon. De browser verlaat de pagina dus niet: op telefoons herlaadt de
 * site van de verhuizer anders soms terwijl de camera-app open is, en dan is
 * de foto weg. Meerdere foto's achter elkaar; "Klaar" gaat terug.
 */
export function InAppCamera({
  room,
  count,
  onCapture,
  onClose,
  onUnavailable,
}: {
  room: string;
  /** Aantal foto's dat al in deze ruimte zit. */
  count: number;
  onCapture: (photo: Blob) => void;
  onClose: () => void;
  /** Geen toestemming of geen camera: terugvallen op de gewone bestandskiezer. */
  onUnavailable: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    rootRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" }, // achtercamera
          width: { ideal: 1920 },
          height: { ideal: 1440 },
        },
      })
      .then(async (s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = s;
        try {
          await video.play();
        } catch {
          // iOS speelt soms pas af na een tik; autoplay + playsInline + muted dekt dat meestal
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) onUnavailable();
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function takePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    // Zelfde maat als geüploade foto's: langste zijde max. 1280px, JPEG.
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => blob && onCapture(blob), "image/jpeg", 0.8);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
  }

  return (
    <div ref={rootRef} className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold">{room}</p>
        <p className="text-xs text-slate-600">
          {count} foto{count === 1 ? "" : "'s"}
        </p>
      </div>

      <div className="relative aspect-3/4 w-full overflow-hidden rounded-2xl bg-slate-900">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        {!ready && (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/80">
            Camera starten… Sta toegang toe als je browser erom vraagt.
          </p>
        )}
        {flash && <div className="absolute inset-0 bg-white/70" />}
      </div>

      <p className="text-center text-xs text-slate-600">
        Maak 1–3 foto&apos;s per ruimte, zo dat de meubels goed in beeld zijn.
      </p>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onClose}
          className="w-24 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Klaar
        </button>
        <button
          type="button"
          onClick={takePhoto}
          disabled={!ready}
          aria-label="Foto maken"
          className="h-16 w-16 rounded-full border-4 border-slate-300 bg-(--accent) shadow-md transition active:scale-95 disabled:opacity-40"
        />
        <span className="w-24" />
      </div>
    </div>
  );
}
