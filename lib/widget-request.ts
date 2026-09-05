import { NextResponse } from "next/server";

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS });
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (
    fwd?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "onbekend"
  );
}

// In-memory rate-limiting voor de publieke demo (per instance).
const DEMO_WINDOW_MS = 60 * 60 * 1000;
const DEMO_MAX_PER_IP = 5;
const DEMO_MAX_GLOBAL = 120;
const demoHits = new Map<string, number[]>();

/** Geeft `null` als het mag, anders een foutmelding. */
export function checkDemoRateLimit(ip: string): string | null {
  // Tijdens lokale ontwikkeling niet limiteren.
  if (process.env.NODE_ENV !== "production") return null;

  const now = Date.now();
  for (const [key, times] of demoHits) {
    const kept = times.filter((t) => now - t < DEMO_WINDOW_MS);
    if (kept.length === 0) demoHits.delete(key);
    else demoHits.set(key, kept);
  }
  const global = [...demoHits.values()].reduce((n, t) => n + t.length, 0);
  if (global >= DEMO_MAX_GLOBAL) {
    return "De demo is even te druk bezocht. Probeer het over een uurtje opnieuw.";
  }
  const mine = demoHits.get(ip) ?? [];
  if (mine.length >= DEMO_MAX_PER_IP) {
    return "Je hebt de demo een paar keer gebruikt. Maak een gratis account aan om verder te testen.";
  }
  demoHits.set(ip, [...mine, now]);
  return null;
}
