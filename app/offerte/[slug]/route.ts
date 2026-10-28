import { NextResponse, type NextRequest } from "next/server";
import { getCompanyBySlug } from "@/lib/companies";

/**
 * Kort deellinkje van een verhuizer (moverai.nl/offerte/jansen-verhuizingen):
 * door naar zijn offerte-widget als losse pagina. Onbekend → homepage.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug.toLowerCase());
  const target = company ? `/widget/${company.id}` : "/";
  return NextResponse.redirect(new URL(target, req.nextUrl.origin));
}
