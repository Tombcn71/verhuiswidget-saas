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
  /** Link "Ja, ik wil boeken" (zie lib/leads#bookingUrl); niet bij demo/preview. */
  acceptUrl?: string | null;
  photoUrls?: string[];
  /** Extra antwoorden van de klant, voor in de bedrijfsmail. */
  details?: Record<string, string>;
  /** Legacy — niet meer gebruikt. */
  clearance?: undefined;
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
      ${company.logoUrl ? `<img src="${esc(company.logoUrl)}" alt="${esc(company.name)}" style="max-height:72px;max-width:240px;margin-bottom:16px">` : `<h2 style="margin:0 0 16px">${esc(company.name)}</h2>`}
      ${inner}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
      <p style="font-size:12px;color:#64748b">
        ${esc(company.name)}${company.phone ? ` · ${esc(company.phone)}` : ""}${company.email ? ` · ${esc(company.email)}` : ""}
      </p>
    </div>
  </div>`;
}

function moveSummary(d: QuoteData): string {
  const isClearance = d.move.type === "ontruiming";
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
    <tr><td style="padding:2px 0;color:#64748b">Type</td><td>${esc(d.move.type)}</td></tr>
    ${d.move.fromAddress ? `<tr><td style="padding:2px 0;color:#64748b">${isClearance ? "Adres" : "Van"}</td><td>${esc(d.move.fromAddress)}</td></tr>` : ""}
    ${d.move.toAddress ? `<tr><td style="padding:2px 0;color:#64748b">Naar</td><td>${esc(d.move.toAddress)}</td></tr>` : ""}
    ${d.move.moveDate ? `<tr><td style="padding:2px 0;color:#64748b">Datum</td><td>${formatDate(d.move.moveDate)}</td></tr>` : ""}
    ${!isClearance ? `<tr><td style="padding:2px 0;color:#64748b">Afstand</td><td>${Math.round(d.move.distanceKm)} km</td></tr>` : ""}
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
     ${d.acceptUrl ? bookButton(d) : ""}
     <p style="font-size:13px;color:#64748b">Dit is een automatische indicatie op basis van foto-analyse en geen bindende offerte. ${esc(d.company.name)} neemt binnenkort contact met je op om de details te bevestigen.</p>
     <h3 style="font-size:16px">Herkende inboedel</h3>
     ${inventoryBlock(d)}
     ${signatureBlock(d.company)}`,
  );
}

/** Grote knop "Ja, ik wil boeken" in de huisstijlkleur van de verhuizer. */
function bookButton(d: QuoteData): string {
  const what = d.move.type === "ontruiming" ? "ontruiming" : "verhuizing";
  return `<div style="margin:24px 0;text-align:center">
    <p style="font-size:14px;margin:0 0 12px">Klopt het en wil je doorgaan?</p>
    <a href="${esc(d.acceptUrl!)}" style="display:inline-block;background:${esc(d.company.primaryColor)};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:999px">Ja, ik wil deze ${what} boeken</a>
    <p style="font-size:12px;color:#64748b;margin:12px 0 0">${esc(d.company.name)} bevestigt daarna de details met je.</p>
  </div>`;
}

/**
 * Melding aan de verhuizer: een klant heeft op "Ja, ik wil boeken" gedrukt.
 * Zonder actief plan (proef verlopen) zonder klantgegevens, net als in het dashboard.
 */
export async function sendBookingNotification(input: {
  company: Company;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  moveType: string;
  moveDate?: string | null;
  totalCents: number;
  leadUrl: string;
  showDetails: boolean;
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.QUOTE_FROM_EMAIL;
  if (!apiKey || !from) return { sent: false };

  const c = input.company;
  const what = input.moveType === "ontruiming" ? "ontruiming" : "verhuizing";
  const subject = input.showDetails
    ? `🎉 ${input.customerName} wil boeken (${formatEuroCents(input.totalCents)})`
    : "🎉 Een klant wil boeken";
  const body = input.showDetails
    ? `<h1 style="font-size:20px">${esc(input.customerName)} wil de ${what} boeken</h1>
       <table style="font-size:14px;margin:16px 0">
         <tr><td style="padding:2px 12px 2px 0;color:#64748b">Bedrag</td><td><strong>${formatEuroCents(input.totalCents)}</strong> incl. btw</td></tr>
         ${input.moveDate ? `<tr><td style="padding:2px 12px 2px 0;color:#64748b">Datum</td><td>${formatDate(input.moveDate)}</td></tr>` : ""}
         <tr><td style="padding:2px 12px 2px 0;color:#64748b">E-mail</td><td>${esc(input.customerEmail)}</td></tr>
         ${input.customerPhone ? `<tr><td style="padding:2px 12px 2px 0;color:#64748b">Telefoon</td><td>${esc(input.customerPhone)}</td></tr>` : ""}
       </table>
       <p style="font-size:14px">Bevestig de afspraak met de klant en zet de lead daarna op <strong>Gewonnen</strong>.</p>`
    : `<h1 style="font-size:20px">Een klant wil een ${what} boeken</h1>
       <p style="font-size:14px">Je proefperiode is afgelopen. Activeer een plan om de gegevens van deze klant te zien.</p>`;

  try {
    await new Resend(apiKey).emails.send({
      from: `moverAI <${from}>`,
      to: c.email,
      ...(input.showDetails ? { replyTo: input.customerEmail } : {}),
      subject,
      html: baseLayout(
        c,
        `${body}<p style="margin-top:20px"><a href="${esc(input.leadUrl)}" style="display:inline-block;background:#1a73e8;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">Bekijk in je dashboard</a></p>`,
      ),
    });
    return { sent: true };
  } catch {
    return { sent: false };
  }
}

/** Handtekening van de verhuizer (Dashboard → Bedrijf), of een nette standaardgroet. */
function signatureBlock(company: Company): string {
  const text = company.emailSignature?.trim() || `Met vriendelijke groet,\n\n${company.name}`;
  return `<p style="font-size:14px;margin-top:24px">${esc(text).replace(/\n/g, "<br>")}</p>`;
}

function detailRows(details: Record<string, string> | undefined): string {
  if (!details) return "";
  const rows = Object.entries(details)
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:2px 0;color:#64748b">${esc(k)}</td><td>${esc(v)}</td></tr>`,
    )
    .join("");
  return rows ? `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:8px 0">${rows}</table>` : "";
}

function photoBlock(urls: string[] | undefined): string {
  if (!urls?.length) return "";
  const imgs = urls
    .map(
      (u) =>
        `<a href="${esc(u)}" target="_blank"><img src="${esc(u)}" alt="foto" style="width:120px;height:120px;object-fit:cover;border-radius:8px;margin:0 6px 6px 0"></a>`,
    )
    .join("");
  return `<h3 style="font-size:16px">Foto's van de klant (${urls.length})</h3><div>${imgs}</div>`;
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
     ${detailRows(d.details)}
     <h3 style="font-size:16px">Berekende prijs</h3>
     ${priceBlock(d)}
     ${photoBlock(d.photoUrls)}
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
