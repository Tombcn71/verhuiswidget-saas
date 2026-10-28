import { mailer, sender } from "@/lib/mailer";
import type { Company } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { isDemoCompany } from "@/lib/demo";
import { countLeadsThisMonth } from "@/lib/leads";
import { CONTACT_EMAIL, nextPlan, planFor } from "@/lib/plans";

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );
}

/**
 * Harde stop: zijn de scans van deze maand op, dan geen nieuwe (betaalde)
 * AI-analyse meer. De klant kan nog wel een aanvraag zonder prijs achterlaten
 * (/api/widget/contact), zodat de verhuizer geen lead mist.
 */
export async function scanLimitReached(company: Company): Promise<boolean> {
  if (isDemoCompany(company.id)) return false;
  const limit = planFor(company).scans;
  if (limit === null) return false;
  return (await countLeadsThisMonth(company.id)) >= limit;
}

/** Drempel voor de waarschuwingsmail: 80% van de scans. */
const warnAt = (limit: number) => Math.ceil(limit * 0.8);

/**
 * Na het opslaan van een gescande lead: mail aan de verhuizer bij 80% en bij
 * 100% van zijn scans, en bij 100% ook een seintje aan moverAI. Precies op de
 * drempel, dus één mail per drempel per maand.
 */
export async function notifyScanUsage(company: Company): Promise<void> {
  const plan = planFor(company);
  if (plan.scans === null) return;
  const used = await countLeadsThisMonth(company.id);
  const full = used === plan.scans;
  if (!full && used !== warnAt(plan.scans)) return;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.QUOTE_FROM_EMAIL;
  if (!apiKey || !from) return;
  const client = mailer(apiKey);
  const upgrade = nextPlan(plan);
  const link = `${appUrl()}/dashboard/abonnement`;
  const style = "font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#0f172a;max-width:560px";
  const more = upgrade
    ? `Met ${esc(upgrade.label)} heb je ${upgrade.scans} scans per maand.`
    : `Mail ons op ${CONTACT_EMAIL} voor een pakket op maat.`;

  await client.emails.send({
    from: sender("moverAI", "aanvragen") ?? `moverAI <${from}>`,
    to: company.email,
    replyTo: CONTACT_EMAIL,
    subject: full
      ? "Je scans van deze maand zijn op"
      : `Je hebt ${used} van je ${plan.scans} scans gebruikt`,
    html: `<div style="${style}">
      <p>Hoi,</p>
      ${
        full
          ? `<p>Je hebt deze maand alle ${plan.scans} inboedelscans van ${esc(plan.label)} gebruikt. Nieuwe klanten krijgen nu geen directe prijs meer: ze kunnen alleen hun gegevens achterlaten, en jij moet ze zelf terugbellen.</p>`
          : `<p>Je hebt deze maand ${used} van je ${plan.scans} inboedelscans gebruikt. Zijn ze op, dan krijgen nieuwe klanten geen directe prijs meer.</p>`
      }
      <p>${more}</p>
      <p style="margin:24px 0"><a href="${esc(link)}" style="display:inline-block;background:#1a73e8;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:999px">${upgrade ? `Upgrade naar ${esc(upgrade.label)}` : "Bekijk je abonnement"}</a></p>
      <p>Groet,<br>moverAI</p>
    </div>`,
  });

  if (!full) return;
  await client.emails.send({
    from: sender("moverAI", "aanvragen") ?? `moverAI <${from}>`,
    to: CONTACT_EMAIL,
    replyTo: company.email,
    subject: `${company.name}: scans op (${plan.scans}, ${plan.label})`,
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px">
      <p><strong>${esc(company.name)}</strong> heeft deze maand alle ${plan.scans} inboedelscans gebruikt (pakket ${esc(plan.label)}). Klanten krijgen nu geen directe prijs meer.</p>
      <p>Bel ze voor ${upgrade ? esc(upgrade.label) : "een pakket op maat"}.</p>
      <p>E-mail: ${esc(company.email)}<br>Telefoon: ${esc(company.phone ?? "—")}</p>
      <p><a href="${esc(appUrl())}/admin">${esc(appUrl())}/admin</a></p>
    </div>`,
  });
}
