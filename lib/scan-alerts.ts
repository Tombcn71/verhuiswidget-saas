import { mailer, sender } from "@/lib/mailer";
import type { Company } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { countLeadsThisMonth } from "@/lib/leads";
import { CONTACT_EMAIL, planFor } from "@/lib/plans";

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );
}

/**
 * Seintje aan moverAI zodra een bedrijf deze maand voor het eerst over zijn
 * scans gaat. De limiet is zacht (nooit blokkeren), dus Tom belt zo'n klant
 * voor een groter pakket of een pakket op maat. Aanroepen na het opslaan van
 * een lead; één mail per maand, precies bij scan limiet + 1.
 */
export async function notifyIfOverScanLimit(company: Company): Promise<void> {
  const plan = planFor(company);
  if (plan.scans === null) return;
  const used = await countLeadsThisMonth(company.id);
  if (used !== plan.scans + 1) return;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.QUOTE_FROM_EMAIL;
  if (!apiKey || !from) return;

  await mailer(apiKey).emails.send({
    from: sender("moverAI", "aanvragen") ?? `moverAI <${from}>`,
    to: CONTACT_EMAIL,
    replyTo: company.email,
    subject: `${company.name} zit boven de ${plan.scans} scans (${plan.label})`,
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px">
      <p><strong>${esc(company.name)}</strong> heeft deze maand meer dan ${plan.scans} inboedelscans gedaan (pakket ${esc(plan.label)}). Alles blijft gewoon werken.</p>
      <p>Bel ze voor een groter pakket of een pakket op maat.</p>
      <p>E-mail: ${esc(company.email)}<br>Telefoon: ${esc(company.phone ?? "—")}</p>
      <p><a href="${esc(appUrl())}/admin">${esc(appUrl())}/admin</a></p>
    </div>`,
  });
}
