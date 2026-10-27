import { NextResponse, type NextRequest } from "next/server";
import { getProspectBySlug, updateProspect } from "@/lib/prospects";
import { cancelAutoMails } from "@/lib/prospect-mails";

/**
 * "Plan een adviesgesprek" (opvolgmail, demo-mail, slotscherm en boekingspagina
 * van de demo): klik vastleggen (📅 in de CRM), een nog ingeplande opvolgmail
 * schrappen (anders krijgt hij een uitnodiging voor een gesprek dat hij al
 * plant) en door naar Calendly, met naam en e-mail alvast ingevuld.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const calendly = process.env.CALENDLY_URL || "https://calendly.com";
  const p = await getProspectBySlug(slug);
  if (!p) return NextResponse.redirect(calendly);

  if (!p.meetingClickedAt) await updateProspect(p.id, { meetingClickedAt: new Date() });
  if (p.followUpEmailId || p.reminderEmailId) await cancelAutoMails(p).catch(() => {});
  const url = new URL(calendly);
  url.searchParams.set("name", p.contactName || p.companyName);
  if (p.email) url.searchParams.set("email", p.email);
  return NextResponse.redirect(url);
}
