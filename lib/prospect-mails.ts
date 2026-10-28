import { mailer, sender } from "@/lib/mailer";
import type { Prospect } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { CONTACT_EMAIL } from "@/lib/plans";
import {
  demoLinkFor,
  getProspectBySlug,
  markDemoCompleted,
  markDemoOpened,
  updateProspect,
} from "@/lib/prospects";

/**
 * Mails van moverAI aan verhuisbedrijven uit de verkoop-CRM (via Resend):
 * 1. "Demo, zoals besproken" — Tom klikt "Demo mailen" na het telefoongesprek.
 * 2a. "Even de demo bekijken?" — ingepland +3 dagen, geannuleerd zodra ze openen.
 * 2b. "Wat vond je ervan?" + adviesgesprek (Calendly) — de ochtend na de demo.
 * Nooit meer dan deze ene opvolgmail; stopt bij proef/klant/afgevallen of "niet meer mailen".
 */

const SENDER = "Tom van moverAI";
const STOPPED_STAGES = ["gesprek", "proef", "klant", "afgevallen"];

function resend(): { client: ReturnType<typeof mailer>; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.QUOTE_FROM_EMAIL;
  return apiKey && from ? { client: mailer(apiKey), from } : null;
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;"));

const firstName = (p: Prospect) => p.contactName?.trim().split(/\s+/)[0] ?? null;

/** Rond 10:00 Nederlandse tijd, `days` dagen vanaf nu. */
function morningIn(days: number): Date {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  d.setUTCHours(8, 30, 0, 0); // ± 10:30 zomertijd, 9:30 wintertijd
  return d;
}

const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:#1a73e8;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;border-radius:999px">${label}</a>`;

const layout = (body: string) =>
  `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;font-size:15px;line-height:1.55">${body}<p>Groet,<br>Tom<br>moverAI</p></div>`;

/** Link naar het adviesgesprek via moverAI (telt de klik), daarna door naar Calendly. */
export function meetingLinkFor(p: Pick<Prospect, "slug">): string {
  return `${appUrl()}/gesprek/${p.slug}`;
}

/**
 * "Plan een adviesgesprek" vanuit de demo. Persoonlijke demolink: via /gesprek,
 * dat de klik vastlegt en de opvolgmail schrapt. Anders rechtstreeks naar
 * Calendly met naam en e-mail ingevuld. Null zonder CALENDLY_URL.
 */
export function demoMeetingUrl(
  prospect: string | undefined,
  person: { name: string; email: string },
): string | null {
  const calendly = process.env.CALENDLY_URL;
  if (!calendly) return null;
  if (prospect) return meetingLinkFor({ slug: prospect });
  const url = new URL(calendly);
  url.searchParams.set("name", person.name);
  url.searchParams.set("email", person.email);
  return url.toString();
}

/** Mail 1: de persoonlijke demolink, na het telefoongesprek. Plant meteen de herinnering in. */
export async function sendDemoMail(p: Prospect): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!p.email) return { ok: false, error: "Vul eerst een e-mailadres in." };
  const r = resend();
  if (!r) return { ok: false, error: "Mail is niet ingesteld (RESEND_API_KEY / QUOTE_FROM_EMAIL)." };
  const hi = firstName(p) ? `Hoi ${esc(firstName(p)!)},` : "Hoi,";

  const sent = await r.client.emails.send({
    from: sender(SENDER, "tom") ?? `${SENDER} <${r.from}>`,
    to: p.email,
    replyTo: CONTACT_EMAIL,
    subject: "De moverAI-demo, zoals besproken",
    html: layout(`
      <p>${hi}</p>
      <p>Leuk je net te spreken! Zoals beloofd: hier zie je in 1 minuut zelf hoe moverAI werkt, precies zoals jouw klanten het straks zien.</p>
      <p style="margin:24px 0">${button(demoLinkFor(p), "Probeer de demo")}</p>
      <p>Maak een paar foto's van een kamer en de AI doet de rest.</p>`),
  });
  if (sent.error) return { ok: false, error: sent.error.message };

  // Herinnering over 3 dagen; wordt geannuleerd zodra ze de demo openen.
  let reminderEmailId: string | null = null;
  let reminderAt: Date | null = null;
  if (!p.autoMailOff && !p.demoOpenedAt) {
    reminderAt = morningIn(3);
    const reminder = await r.client.emails.send({
      from: sender(SENDER, "tom") ?? `${SENDER} <${r.from}>`,
      to: p.email,
      replyTo: CONTACT_EMAIL,
      subject: "Even de demo bekijken?",
      scheduledAt: reminderAt.toISOString(),
      html: layout(`
        <p>${hi}</p>
        <p>Misschien is het erbij ingeschoten: de demo van moverAI staat nog voor je klaar. Het kost maar een minuut.</p>
        <p style="margin:24px 0">${button(demoLinkFor(p), "Probeer de demo")}</p>`),
    });
    reminderEmailId = reminder.data?.id ?? null;
  }

  await updateProspect(p.id, {
    demoSentAt: new Date(),
    ...(["nieuw", "gebeld"].includes(p.stage) ? { stage: "demo_gestuurd" } : {}),
    reminderEmailId,
    reminderAt: reminderEmailId ? reminderAt : null,
  });
  return { ok: true };
}

/** Geplande mails annuleren (bijv. proef gestart, klant, afgevallen, "niet meer mailen"). */
export async function cancelAutoMails(p: Prospect, which: "reminder" | "all" = "all"): Promise<void> {
  const r = resend();
  const pending = [
    p.reminderEmailId && p.reminderAt && p.reminderAt > new Date() ? p.reminderEmailId : null,
    which === "all" && p.followUpEmailId && p.followUpAt && p.followUpAt > new Date()
      ? p.followUpEmailId
      : null,
  ].filter((id): id is string => !!id);
  if (r) await Promise.allSettled(pending.map((id) => r.client.emails.cancel(id)));
  await updateProspect(p.id, {
    ...(p.reminderEmailId ? { reminderEmailId: null, reminderAt: null } : {}),
    ...(which === "all" && p.followUpAt && p.followUpAt > new Date()
      ? { followUpEmailId: null, followUpAt: null }
      : {}),
  });
}

/** Demolink geopend: vastleggen en de herinnering is niet meer nodig. */
export async function handleDemoOpened(slug: string): Promise<void> {
  await markDemoOpened(slug);
  const p = await getProspectBySlug(slug);
  if (p?.reminderEmailId) await cancelAutoMails(p, "reminder");
}

/**
 * Demo afgerond: fase "Demo gedaan", herinnering weg, en de ochtend erna
 * "Wat vond je ervan?" met de link naar een adviesgesprek.
 */
export async function handleDemoCompleted(slug: string): Promise<void> {
  await markDemoCompleted(slug);
  const p = await getProspectBySlug(slug);
  if (!p) return;
  if (p.reminderEmailId) await cancelAutoMails(p, "reminder");
  // Al op "Plan een adviesgesprek" geklikt: geen uitnodiging meer nodig.
  if (
    !p.email ||
    p.autoMailOff ||
    p.followUpEmailId ||
    p.meetingClickedAt ||
    STOPPED_STAGES.includes(p.stage)
  )
    return;

  const r = resend();
  if (!r) return;
  const hi = firstName(p) ? `Hoi ${esc(firstName(p)!)},` : "Hoi,";
  const followUpAt = morningIn(1);
  const mail = await r.client.emails.send({
    from: sender(SENDER, "tom") ?? `${SENDER} <${r.from}>`,
    to: p.email,
    replyTo: CONTACT_EMAIL,
    subject: "Wat vond je van de demo?",
    scheduledAt: followUpAt.toISOString(),
    html: layout(`
      <p>${hi}</p>
      <p>Je hebt de demo van moverAI uitgeprobeerd. Wat vond je ervan?</p>
      <p>Zullen we vrijblijvend een half uur kijken hoe moverAI werkt met <strong>jouw</strong> tarieven en <strong>jouw</strong> website?</p>
      <p style="margin:24px 0">${button(meetingLinkFor(p), "Plan een vrijblijvend adviesgesprek")}</p>
      <p>Of begin direct zelf: <a href="${esc(appUrl())}/#prijzen" style="color:#1a73e8">14 dagen gratis, zonder betaalgegevens</a>.</p>`),
  });
  if (mail.data?.id) await updateProspect(p.id, { followUpEmailId: mail.data.id, followUpAt });
}
