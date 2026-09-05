import { Resend } from "resend";
import type { Company, InventoryItem, PriceLine } from "@/lib/db/schema";
import { formatEuroCents, formatDate } from "@/lib/format";

type QuoteData = {
  company: Company;
  customer: { name: string; email: string; phone?: string | null };
  move: {
    type: string;
    fromAddress?: string | null;
    toAddress?: string | null;
    moveDate?: string | null;
    distanceKm: number;
  };
  inventory: InventoryItem[];
  totalVolumeM3: number;
  breakdown: PriceLine[];
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  leadId: string;
  /** Alleen bij een ontruiming — vervangt de m³-inboedel in de e-mail. */
  clearance?: {
    postcode: string;
    propertyType: string;
    areaM2: number;
    floor: number;
    fillLevel: string;
    estimatedBoxes: number;
    specialItems: string[];
    items: { name: string; quantity: number; size: string }[];
  };
};

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );
}

function inventoryRows(items: InventoryItem[]): string {
  return items
    .map(
      (i) =>
        `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee">${esc(i.name)}</td>` +
        `<td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${i.quantity}×</td>` +
        `<td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${(i.volumeM3 * i.quantity).toFixed(2)} m³</td></tr>`,
    )
    .join("");
}

function priceRows(lines: PriceLine[]): string {
  return lines
    .map(
      (l) =>
        `<tr><td style="padding:4px 8px">${esc(l.label)}</td>` +
        `<td style="padding:4px 8px;text-align:right">${formatEuroCents(l.amountCents)}</td></tr>`,
    )
    .join("");
}

function baseLayout(company: Company, inner: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a">
    <div style="border-top:4px solid ${esc(company.primaryColor)};padding:24px 4px">
      ${company.logoUrl ? `<img src="${esc(company.logoUrl)}" alt="${esc(company.name)}" style="max-height:48px;margin-bottom:16px">` : `<h2 style="margin:0 0 16px">${esc(company.name)}</h2>`}
      ${inner}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
      <p style="font-size:12px;color:#64748b">
        ${esc(company.name)}${company.phone ? ` · ${esc(company.phone)}` : ""}${company.email ? ` · ${esc(company.email)}` : ""}
      </p>
    </div>
  </div>`;
}

function moveSummary(d: QuoteData): string {
  if (d.clearance) {
    const c = d.clearance;
    return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:2px 0;color:#64748b">Type</td><td>Woningontruiming</td></tr>
      ${c.postcode ? `<tr><td style="padding:2px 0;color:#64748b">Postcode</td><td>${esc(c.postcode)}</td></tr>` : ""}
      ${c.propertyType ? `<tr><td style="padding:2px 0;color:#64748b">Woningtype</td><td>${esc(c.propertyType)}</td></tr>` : ""}
      <tr><td style="padding:2px 0;color:#64748b">Oppervlak</td><td>${Math.round(c.areaM2)} m²</td></tr>
      <tr><td style="padding:2px 0;color:#64748b">Verdieping</td><td>${c.floor === 0 ? "begane grond" : `${c.floor}e`}</td></tr>
      <tr><td style="padding:2px 0;color:#64748b">Inschatting</td><td>${esc(c.fillLevel)}</td></tr>
    </table>`;
  }
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
    <tr><td style="padding:2px 0;color:#64748b">Type</td><td>${esc(d.move.type)}</td></tr>
    ${d.move.fromAddress ? `<tr><td style="padding:2px 0;color:#64748b">Van</td><td>${esc(d.move.fromAddress)}</td></tr>` : ""}
    ${d.move.toAddress ? `<tr><td style="padding:2px 0;color:#64748b">Naar</td><td>${esc(d.move.toAddress)}</td></tr>` : ""}
    ${d.move.moveDate ? `<tr><td style="padding:2px 0;color:#64748b">Datum</td><td>${formatDate(d.move.moveDate)}</td></tr>` : ""}
    <tr><td style="padding:2px 0;color:#64748b">Afstand</td><td>${Math.round(d.move.distanceKm)} km</td></tr>
    <tr><td style="padding:2px 0;color:#64748b">Volume</td><td>${d.totalVolumeM3.toFixed(1)} m³</td></tr>
  </table>`;
}

function priceBlock(d: QuoteData): string {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:8px 0">
    ${priceRows(d.breakdown)}
    <tr><td style="padding:4px 8px;border-top:1px solid #e2e8f0">Subtotaal</td><td style="padding:4px 8px;text-align:right;border-top:1px solid #e2e8f0">${formatEuroCents(d.subtotalCents)}</td></tr>
    <tr><td style="padding:4px 8px">Btw (21%)</td><td style="padding:4px 8px;text-align:right">${formatEuroCents(d.vatCents)}</td></tr>
    <tr><td style="padding:8px;font-weight:700;border-top:2px solid #0f172a">Totaal incl. btw</td><td style="padding:8px;text-align:right;font-weight:700;border-top:2px solid #0f172a">${formatEuroCents(d.totalCents)}</td></tr>
  </table>`;
}

function inventoryBlock(d: QuoteData): string {
  if (d.clearance) {
    const c = d.clearance;
    const rows = c.items
      .map(
        (i) =>
          `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee">${esc(i.name)}</td>` +
          `<td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${i.quantity}×</td>` +
          `<td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${esc(i.size)}</td></tr>`,
      )
      .join("");
    return `<table style="width:100%;border-collapse:collapse;font-size:13px;margin:8px 0">
      <thead><tr>
        <th style="padding:4px 8px;text-align:left;border-bottom:2px solid #0f172a">Object</th>
        <th style="padding:4px 8px;text-align:right;border-bottom:2px solid #0f172a">Aantal</th>
        <th style="padding:4px 8px;text-align:right;border-bottom:2px solid #0f172a">Formaat</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:13px;margin:8px 0">Geschat aantal dozen/tassen: <strong>${c.estimatedBoxes}</strong></p>
    ${c.specialItems.length ? `<p style="font-size:13px;margin:8px 0">Bijzondere items: ${esc(c.specialItems.join(", "))}</p>` : ""}`;
  }
  return `<table style="width:100%;border-collapse:collapse;font-size:13px;margin:8px 0">
    <thead><tr>
      <th style="padding:4px 8px;text-align:left;border-bottom:2px solid #0f172a">Object</th>
      <th style="padding:4px 8px;text-align:right;border-bottom:2px solid #0f172a">Aantal</th>
      <th style="padding:4px 8px;text-align:right;border-bottom:2px solid #0f172a">Volume</th>
    </tr></thead>
    <tbody>${inventoryRows(d.inventory)}</tbody>
  </table>`;
}

function customerEmailHtml(d: QuoteData): string {
  return baseLayout(
    d.company,
    `<h1 style="font-size:20px">Je offerte-indicatie</h1>
     <p style="font-size:14px">Beste ${esc(d.customer.name)},</p>
     <p style="font-size:14px">Bedankt voor je aanvraag bij ${esc(d.company.name)}. Op basis van de foto's die je hebt geüpload hebben we automatisch een inschatting gemaakt van je inboedel en de kosten.</p>
     ${moveSummary(d)}
     <h3 style="font-size:16px">Prijsindicatie</h3>
     ${priceBlock(d)}
     <p style="font-size:13px;color:#64748b">Dit is een automatische indicatie op basis van foto-analyse en geen bindende offerte. ${esc(d.company.name)} neemt binnenkort contact met je op om de details te bevestigen.</p>
     <h3 style="font-size:16px">Herkende inboedel</h3>
     ${inventoryBlock(d)}`,
  );
}

function companyEmailHtml(d: QuoteData): string {
  return baseLayout(
    d.company,
    `<h1 style="font-size:20px">Nieuwe offerteaanvraag</h1>
     <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
       <tr><td style="padding:2px 0;color:#64748b">Naam</td><td>${esc(d.customer.name)}</td></tr>
       <tr><td style="padding:2px 0;color:#64748b">E-mail</td><td><a href="mailto:${esc(d.customer.email)}">${esc(d.customer.email)}</a></td></tr>
       ${d.customer.phone ? `<tr><td style="padding:2px 0;color:#64748b">Telefoon</td><td>${esc(d.customer.phone)}</td></tr>` : ""}
     </table>
     ${moveSummary(d)}
     <h3 style="font-size:16px">Berekende prijs</h3>
     ${priceBlock(d)}
     <h3 style="font-size:16px">Volledige inventarislijst</h3>
     ${inventoryBlock(d)}
     <p style="font-size:12px;color:#64748b">Lead-id: ${esc(d.leadId)}</p>`,
  );
}

/**
 * Verstuurt twee e-mails: één naar de klant, één naar het verhuisbedrijf.
 * Gooit geen fout als e-mail niet is geconfigureerd (lead wordt dan toch opgeslagen).
 */
export async function sendQuoteEmails(
  d: QuoteData,
  opts: { customerOnly?: boolean } = {},
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.QUOTE_FROM_EMAIL;
  if (!apiKey || !from) {
    return { sent: false, error: "RESEND_API_KEY of QUOTE_FROM_EMAIL ontbreekt" };
  }

  const resend = new Resend(apiKey);
  const fromHeader = `${d.company.name} <${from}>`;

  const mails = [
    resend.emails.send({
      from: fromHeader,
      to: d.customer.email,
      replyTo: d.company.email,
      subject: `Je offerte-indicatie van ${d.company.name}`,
      html: customerEmailHtml(d),
    }),
  ];
  if (!opts.customerOnly) {
    mails.push(
      resend.emails.send({
        from: fromHeader,
        to: d.company.email,
        replyTo: d.customer.email,
        subject: `Nieuwe offerteaanvraag — ${d.customer.name} (${formatEuroCents(d.totalCents)})`,
        html: companyEmailHtml(d),
      }),
    );
  }

  try {
    await Promise.all(mails);
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "onbekende fout" };
  }
}
