import { and, desc, eq, isNull } from "drizzle-orm";
import { mailer, sender } from "@/lib/mailer";
import { db, demoLeads, type DemoLead } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { formatEuroCents } from "@/lib/format";
import { CONTACT_EMAIL } from "@/lib/plans";

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );
}

/**
 * Demo afgerond: opslaan voor /admin en moverAI direct een seintje geven. De
 * opvolgmail loopt via de verkoop-CRM (handleDemoCompleted). Mailfouten zijn
 * niet fataal voor de demo.
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

  await notifyMoverAI(lead).catch(() => {});
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

function resend(): { client: ReturnType<typeof mailer>; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.QUOTE_FROM_EMAIL;
  return apiKey && from ? { client: mailer(apiKey), from } : null;
}

/** Direct seintje naar moverAI: een (waarschijnlijke) verhuizer heeft de demo gedaan. */
async function notifyMoverAI(lead: DemoLead): Promise<void> {
  const r = resend();
  if (!r) return;
  await r.client.emails.send({
    from: sender("moverAI", "aanvragen") ?? `moverAI <${r.from}>`,
    to: CONTACT_EMAIL,
    replyTo: lead.email,
    subject: `Nieuwe demo-lead: ${lead.name}`,
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px">
      <p><strong>${esc(lead.name)}</strong> heeft de demo afgerond.</p>
      <p>E-mail: ${esc(lead.email)}<br>Telefoon: ${esc(lead.phone ?? "—")}<br>Demo: ${esc(lead.moveType)}, ${formatEuroCents(lead.totalCents)}</p>
      <p>Staat in het CRM op Demo gedaan. Morgenochtend gaat vanzelf "Wat vond je van de demo?", tenzij hij al een gesprek inplant. CRM: <a href="${esc(appUrl())}/admin">${esc(appUrl())}/admin</a></p>
    </div>`,
  });
}
