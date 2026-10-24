import { NextResponse, type NextRequest } from "next/server";
import { getProspectBySlug, updateProspect } from "@/lib/prospects";

/**
 * "Plan een vrijblijvend adviesgesprek" in de opvolgmail: klik vastleggen
 * (📅 in de CRM) en door naar Calendly, met naam en e-mail alvast ingevuld.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const calendly = process.env.CALENDLY_URL || "https://calendly.com";
  const p = await getProspectBySlug(slug);
  if (!p) return NextResponse.redirect(calendly);

  if (!p.meetingClickedAt) await updateProspect(p.id, { meetingClickedAt: new Date() });
  const url = new URL(calendly);
  url.searchParams.set("name", p.contactName || p.companyName);
  if (p.email) url.searchParams.set("email", p.email);
  return NextResponse.redirect(url);
}
