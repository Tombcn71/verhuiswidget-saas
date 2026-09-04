import { NextResponse } from "next/server";
import { getCompanyById } from "@/lib/companies";

export const runtime = "nodejs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * Publieke huisstijl-info voor `embed.js` (popup-knop in de juiste kleur).
 * GET /api/widget/meta?id=<companyId>
 */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id ontbreekt." }, { status: 400, headers: CORS });
  }

  const company = await getCompanyById(id);
  if (!company) {
    return NextResponse.json({ error: "Onbekende verhuizer." }, { status: 404, headers: CORS });
  }

  return NextResponse.json(
    { name: company.name, primaryColor: company.primaryColor },
    { headers: { ...CORS, "Cache-Control": "public, max-age=300, s-maxage=300" } },
  );
}
