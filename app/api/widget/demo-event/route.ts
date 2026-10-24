import { NextResponse } from "next/server";
import { markDemoBooked } from "@/lib/prospects";
import { CORS, jsonResponse as json } from "@/lib/widget-request";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * Klik op "Ja, ik wil boeken" ín de demo-widget (zonder e-mail) via een
 * persoonlijke demolink: 🔥 in de verkoop-CRM. Body: { prospect: "<slug>" }.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { prospect?: unknown } | null;
  const slug = typeof body?.prospect === "string" ? body.prospect.slice(0, 60) : "";
  if (slug) await markDemoBooked(slug);
  return json({ ok: true });
}
