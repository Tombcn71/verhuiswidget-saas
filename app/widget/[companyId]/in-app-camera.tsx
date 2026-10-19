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

  // Schermvullend, zoals de camera-app: zwart, beeld over de hele hoogte,
  // knoppen eroverheen. Rekening houden met de notch/home-balk (safe-area).
  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label={`Camera: ${room}`}
      className="fixed inset-0 z-50 flex flex-col bg-black text-white"
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />
      {!ready && (
        <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-white/80">
          Camera starten… Sta toegang toe als je browser erom vraagt.
        </p>
      )}
      {flash && <div className="absolute inset-0 bg-white/70" />}

      {/* Boven: ruimte + aantal foto's */}
      {/* Links houden: rechtsboven zit op de telefoon het sluitkruisje van de pop-up. */}
      <div className="relative flex items-center gap-3 bg-linear-to-b from-black/60 to-transparent px-5 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="text-base font-semibold">{room}</p>
        <p className="rounded-full bg-black/40 px-3 py-1 text-sm">
          {count} foto{count === 1 ? "" : "'s"}
        </p>
      </div>

      <div className="flex-1" />

      {/* Onder: tip, Klaar en sluiter */}
      <div className="relative bg-linear-to-t from-black/70 to-transparent px-6 pt-10 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <p className="mb-5 text-center text-sm text-white/90">
          Maak 1–3 foto&apos;s per ruimte, met de meubels goed in beeld.
        </p>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="w-20 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur"
          >
            Klaar
          </button>
          <button
            type="button"
            onClick={takePhoto}
            disabled={!ready}
            aria-label="Foto maken"
            className="h-20 w-20 rounded-full border-[5px] border-white bg-white/30 transition active:scale-90 disabled:opacity-40"
          />
          <span className="w-20" />
        </div>
      </div>
    </div>
  );
}
