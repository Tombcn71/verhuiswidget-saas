"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { ResolvedAddress } from "@/lib/geo";

export type AddressValue = {
  postcode: string;
  houseNumber: string;
  addition: string;
  resolved: ResolvedAddress | null;
};

export const EMPTY_ADDRESS: AddressValue = {
  postcode: "",
  houseNumber: "",
  addition: "",
  resolved: null,
};

/** Volledig adres als tekst (incl. toevoeging), of "" als het nog niet gevonden is. */
export function addressText(a: AddressValue): string {
  if (!a.resolved) return "";
  return a.addition.trim()
    ? a.resolved.label.replace(/^(\S.*?\s\d+)/, `$1 ${a.addition.trim()}`)
    : a.resolved.label;
}

const POSTCODE = /^[1-9]\d{3}\s?[a-zA-Z]{2}$/;

/**
 * Postcode + huisnummer (+ toevoeging). Zoekt het adres op via PDOK zodra beide
 * zijn ingevuld en toont straat en plaats, of "niet gevonden".
 */
export function AddressInput({
  label,
  value,
  onChange,
  inputCls,
}: {
  label: string;
  value: AddressValue;
  onChange: (next: AddressValue) => void;
  inputCls: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "notfound">("idle");
  const { postcode, houseNumber } = value;
  const complete = POSTCODE.test(postcode.trim()) && /^\d+/.test(houseNumber.trim());

  useEffect(() => {
    if (!complete) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const params = new URLSearchParams({ postcode, huisnummer: houseNumber });
        const res = await fetch(`/api/widget/address?${params}`);
        const data = res.ok ? ((await res.json()) as ResolvedAddress) : null;
        if (cancelled) return;
        setStatus(data ? "idle" : "notfound");
        onChange({ ...value, resolved: data });
      } catch {
        if (!cancelled) setStatus("notfound");
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // Alleen opnieuw zoeken als postcode of huisnummer verandert.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postcode, houseNumber, complete]);

  const set = (patch: Partial<AddressValue>) =>
    onChange({
      ...value,
      ...patch,
      // Postcode of huisnummer gewijzigd: het oude adres geldt niet meer.
      ...("postcode" in patch || "houseNumber" in patch ? { resolved: null } : {}),
    });

  return (
    <div>
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="mt-1 grid grid-cols-[1fr_5.5rem_4.5rem] gap-2">
        <input
          className={inputCls}
          value={postcode}
          onChange={(e) => set({ postcode: e.target.value.toUpperCase() })}
          placeholder="Postcode"
          autoComplete="postal-code"
          aria-label={`${label}: postcode`}
        />
        <input
          className={inputCls}
          value={houseNumber}
          onChange={(e) => set({ houseNumber: e.target.value })}
          placeholder="Nr."
          inputMode="numeric"
          aria-label={`${label}: huisnummer`}
        />
        <input
          className={inputCls}
          value={value.addition}
          onChange={(e) => set({ addition: e.target.value })}
          placeholder="Toev."
          aria-label={`${label}: toevoeging`}
        />
      </div>
      <p className="mt-1.5 min-h-5 text-xs">
        {value.resolved ? (
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <Check className="size-3.5 shrink-0" /> {addressText(value)}
          </span>
        ) : status === "loading" ? (
          <span className="text-slate-400">Adres zoeken…</span>
        ) : status === "notfound" && complete ? (
          <span className="text-red-600">Adres niet gevonden. Controleer postcode en huisnummer.</span>
        ) : null}
      </p>
    </div>
  );
}
