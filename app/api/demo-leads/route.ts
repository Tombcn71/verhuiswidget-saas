import { NextResponse } from "next/server";
import { listDemoLeads } from "@/lib/demo-leads";

/** Demo-leads voor /admin (zelfde wachtwoord als de feedback). */
export async function GET(req: Request) {
  const pw = new URL(req.url).searchParams.get("pw");
  if (!pw || pw !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }
  return NextResponse.json(await listDemoLeads());
}
