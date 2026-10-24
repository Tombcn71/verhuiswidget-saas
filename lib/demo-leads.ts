import { and, desc, eq, isNull } from "drizzle-orm";
import { Resend } from "resend";
import { db, demoLeads, type DemoLead } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { formatEuroCents } from "@/lib/format";
import { CONTACT_EMAIL } from "@/lib/plans";

/** Afzender van de opvolgmail: persoonlijk, niet "moverAI no-reply". */
const FOLLOW_UP_SENDER = "Tom van moverAI";
/** Opvolgmail niet direct naast de demo-offerte, maar een paar uur later. */
const FOLLOW_UP_DELAY_MS = 2 * 60 * 60 * 1000;

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );
}

/**
 * Demo afgerond mét toestemming: opslaan, opvolgmail inplannen en moverAI
 * direct een seintje geven. Mailfouten zijn niet fataal voor de demo.
 */
export async function recordDemoLead(input: {
  name: string;
  email: string;
  phone?: string | null;
  moveType: string;
  totalCents: number;
}): Promise<DemoLead> {
  const [lead] = await db
    .insert(demoLeads)
    .values({
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      moveType: input.moveType,
      totalCents: input.totalCents,
    })
    .returning();

  await Promise.allSettled([sendFollowUp(lead), notifyMoverAI(lead)]);
  return lead;
}

export async function markDemoLeadBooked(id: string): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  // Alleen de eerste klik telt (herladen van de pagina overschrijft niets).
  await db
    .update(demoLeads)
    .set({ bookedAt: new Date() })
    .where(and(eq(demoLeads.id, id), isNull(demoLeads.bookedAt)));
}

export async function listDemoLeads(limit = 200): Promise<DemoLead[]> {
  return db.select().from(demoLeads).orderBy(desc(demoLeads.createdAt)).limit(limit);
}

function resend(): { client: Resend; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.QUOTE_FROM_EMAIL;
  return apiKey && from ? { client: new Resend(apiKey), from } : null;
}

/** Persoonlijke uitnodiging voor een adviesgesprek, 2 uur na de demo. */
async function sendFollowUp(lead: DemoLead): Promise<void> {
  const r = resend();
  if (!r) return;
  const firstName = lead.name.trim().split(/\s+/)[0] || lead.name;
  const calendly = process.env.CALENDLY_URL;
  const button = (href: string, label: string) =>
    `<a href="${esc(href)}" style="display:inline-block;background:#1a73e8;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:999px">${label}</a>`;

  await r.client.emails.send({
    from: `${FOLLOW_UP_SENDER} <${r.from}>`,
    to: lead.email,
    replyTo: CONTACT_EMAIL,
    subject: "Je moverAI-demo — even sparren?",
    scheduledAt: new Date(Date.now() + FOLLOW_UP_DELAY_MS).toISOString(),
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;font-size:15px;line-height:1.55">
      <p>Hoi ${esc(firstName)},</p>
      <p>Je hebt net de demo van moverAI uitgeprobeerd. Benieuwd wat je ervan vond!</p>
      <p>Zullen we 15 minuten bellen? Dan laat ik zien hoe het werkt met jouw tarieven en jouw website, en beantwoord ik al je vragen.</p>
      <p style="margin:24px 0">${
        calendly
          ? button(calendly, "Plan een adviesgesprek")
          : `Antwoord gewoon op deze mail met een moment dat jou uitkomt.`
      }</p>
      <p>Of begin direct zelf: <a href="${esc(appUrl())}/#prijzen" style="color:#1a73e8">14 dagen gratis, zonder betaalgegevens</a>.</p>
      <p>Groet,<br>Tom<br>moverAI</p>
      <p style="font-size:12px;color:#64748b;margin-top:32px">Je krijgt deze mail omdat je in de demo aangaf dat we je mochten mailen. Geen interesse? Dan hoor je niets meer van ons.</p>
    </div>`,
  });
}

/** Direct seintje naar moverAI: een (waarschijnlijke) verhuizer heeft de demo gedaan. */
async function notifyMoverAI(lead: DemoLead): Promise<void> {
  const r = resend();
  if (!r) return;
  await r.client.emails.send({
    from: `moverAI <${r.from}>`,
    to: CONTACT_EMAIL,
    replyTo: lead.email,
    subject: `Nieuwe demo-lead: ${lead.name}`,
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px">
      <p><strong>${esc(lead.name)}</strong> heeft de demo afgerond en wil gemaild worden.</p>
      <p>E-mail: ${esc(lead.email)}<br>Telefoon: ${esc(lead.phone ?? "—")}<br>Demo: ${esc(lead.moveType)}, ${formatEuroCents(lead.totalCents)}</p>
      <p>De uitnodigingsmail gaat over 2 uur automatisch de deur uit. Alle demo-leads: <a href="${esc(appUrl())}/admin">${esc(appUrl())}/admin</a></p>
    </div>`,
  });
}
