import { mailer, sender } from "@/lib/mailer";
import type { Company, InventoryItem, PriceLine } from "@/lib/db/schema";
import { formatEuroCents, formatDate } from "@/lib/format";
import { planningRows } from "@/lib/planning";
import { CONTACT_EMAIL } from "@/lib/plans";
import type { MovePlanning } from "@/lib/pricing";

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
  /** Wagens, ploeg en uren, voor het planningsblok in de bedrijfsmail. */
  planning?: MovePlanning;
  /** Gekozen extra's (inpakservice, montage, …), voor de bedrijfsmail. */
  extras?: string[];
  /** Legacy — niet meer gebruikt. */
  clearance?: undefined;
};

/** Kubieke meters met een Nederlandse komma, bijv. "22,4". */
function m3(value: number, decimals: number): string {
  return value.toLocaleString("nl-NL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

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
        `<td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${m3(i.volumeM3 * i.quantity, 2)} m³</td></tr>`,
    )
    .join("");
}

/** `withDetail`: uitleg per regel (alleen voor de verhuizer, net als in het dashboard). */
function priceRows(lines: PriceLine[], withDetail = false): string {
  return lines
    .map(
      (l) =>
        `<tr><td style="padding:4px 8px">${esc(l.label)}` +
        (withDetail && l.detail
          ? `<br><span style="font-size:12px;color:#64748b">${esc(l.detail)}</span>`
          : "") +
        `</td><td style="padding:4px 8px;text-align:right;vertical-align:top">${formatEuroCents(l.amountCents)}</td></tr>`,
    )
    .join("");
}

/** Wat de verhuizer moet inplannen: wagens, ploeg, duur, volume, datum en extra's. */
function planningBlock(d: QuoteData): string {
  if (!d.planning) return "";
  const rows = planningRows(d.planning, d.totalVolumeM3);
  if (d.move.moveDate) {
    rows.push({ label: "Datum", value: formatDate(d.move.moveDate) });
  }
  if (d.extras?.length) {
    rows.push({ label: "Extra's", value: d.extras.join(", ") });
  }
  return `<div style="background:#f1f5f9;border-radius:12px;padding:16px 18px;margin:16px 0">
    <p style="margin:0 0 10px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#475569">Planning</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${rows
        .map(
          (r) =>
            `<td style="padding:3px 12px 3px 0;color:#64748b;white-space:nowrap;vertical-align:top">${esc(r.label)}</td>` +
            `<td style="padding:3px 0;font-weight:600">${esc(r.value)}</td></tr>`,
        )
        .join("")}
    </table>
  </div>`;
}

/** Onderaan de verhuizersmail van de demo: uitnodiging voor een gesprek (hoort bij de demo). */
function demoInvite(meetingUrl: string): string {
  return `<div style="background:#e8f0fe;border-radius:12px;padding:18px 20px;margin:24px 0 0;text-align:center">
    <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#0f172a">Benieuwd hoe dit werkt met jouw tarieven?</p>
    <p style="margin:0 0 14px;font-size:14px;color:#334155">Plan een gesprek van 15 minuten. Dan laat ik zien hoe moverAI werkt met jouw manier van rekenen, en beantwoord ik je vragen.</p>
    <a href="${esc(meetingUrl)}" style="display:inline-block;background:#1a73e8;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 26px;border-radius:999px">Plan een adviesgesprek</a>
  </div>`;
}

/** Balk boven de mails van de demo: wiens mail dit is. */
function demoBanner(text: string): string {
  return `<div style="background:#e8f0fe;color:#1557b0;border-radius:10px;padding:10px 14px;margin:0 0 16px;font-size:13px;font-weight:600">${esc(text)}</div>`;
}

function baseLayout(company: Company, inner: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a">
    <div style="border-top:4px solid ${esc(company.primaryColor)};padding:24px 4px">
      <h2 style="margin:0 0 16px">${esc(company.name)}</h2>
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
    <tr><td style="padding:2px 12px 2px 0;width:180px;color:#64748b">Type</td><td>${esc(d.move.type)}</td></tr>
    ${d.move.fromAddress ? `<tr><td style="padding:2px 12px 2px 0;width:180px;color:#64748b">${isClearance ? "Adres" : "Van"}</td><td>${esc(d.move.fromAddress)}</td></tr>` : ""}
    ${d.move.toAddress ? `<tr><td style="padding:2px 12px 2px 0;width:180px;color:#64748b">Naar</td><td>${esc(d.move.toAddress)}</td></tr>` : ""}
    ${d.move.moveDate ? `<tr><td style="padding:2px 12px 2px 0;width:180px;color:#64748b">Voorkeursdatum</td><td>${formatDate(d.move.moveDate)}</td></tr>` : ""}
    ${!isClearance ? `<tr><td style="padding:2px 12px 2px 0;width:180px;color:#64748b">Afstand</td><td>${Math.round(d.move.distanceKm)} km</td></tr>` : ""}
    <tr><td style="padding:2px 12px 2px 0;width:180px;color:#64748b">Volume</td><td>${m3(d.totalVolumeM3, 1)} m³</td></tr>
  </table>`;
}

function priceBlock(d: QuoteData, withDetail = false): string {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:8px 0">
    ${priceRows(d.breakdown, withDetail)}
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

function customerEmailHtml(d: QuoteData, banner = ""): string {
  return baseLayout(
    d.company,
    `${banner}<h1 style="font-size:20px">Je offerte-indicatie</h1>
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
  return bookButtonHtml(d.company, d.acceptUrl!, d.move.type);
}

function bookButtonHtml(company: Company, acceptUrl: string, moveType: string): string {
  const what = moveType === "ontruiming" ? "ontruiming" : "verhuizing";
  return `<div style="margin:24px 0;text-align:center">
    <p style="font-size:14px;margin:0 0 12px">Klopt het en wil je doorgaan?</p>
    ${brandButton(company, acceptUrl, `Ja, ik wil deze ${what} boeken`)}
    <p style="font-size:12px;color:#64748b;margin:12px 0 0">${esc(company.name)} bevestigt daarna de details met je.</p>
  </div>`;
}

function brandButton(company: Company, href: string, label: string): string {
  return `<a href="${esc(href)}" style="display:inline-block;background:${esc(company.primaryColor)};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:999px">${esc(label)}</a>`;
}

/**
 * Herinnering aan de klant als die een paar dagen na de offerte nog niet heeft
 * geboekt. Eén keer per lead (zie lib/lead-mails.ts).
 */
export async function sendQuoteFollowUp(input: {
  company: Company;
  customerName: string;
  customerEmail: string;
  moveType: string;
  moveDate?: string | null;
  totalCents: number;
  acceptUrl: string;
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.QUOTE_FROM_EMAIL;
  if (!apiKey || !from) return { sent: false };

  const c = input.company;
  const what = input.moveType === "ontruiming" ? "ontruiming" : "verhuizing";
  const when = input.moveDate ? ` op ${formatDate(input.moveDate)}` : "";
  const contact = c.phone
    ? `Heb je nog vragen? Antwoord gewoon op deze mail of bel ${esc(c.phone)}.`
    : "Heb je nog vragen? Antwoord gewoon op deze mail.";

  const res = await mailer(apiKey).emails.send({
    from: `${c.name} <${from}>`,
    to: input.customerEmail,
    replyTo: c.email,
    subject: `Nog vragen over je offerte? — ${c.name}`,
    html: baseLayout(
      c,
      `<p style="font-size:14px">Beste ${esc(input.customerName)},</p>
       <p style="font-size:14px">Een paar dagen geleden kreeg je van ons een offerte-indicatie voor je ${what}${when}: <strong>${formatEuroCents(input.totalCents)}</strong> incl. btw.</p>
       <p style="font-size:14px">${contact}</p>
       ${bookButtonHtml(c, input.acceptUrl, input.moveType)}
       ${signatureBlock(c)}`,
    ),
  });
  return { sent: !res.error };
}

/** Na de verhuisdatum: vraag de klant om een review (link uit Dashboard → Bedrijf). */
export async function sendReviewRequest(input: {
  company: Company;
  customerName: string;
  customerEmail: string;
  moveType: string;
  reviewUrl: string;
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.QUOTE_FROM_EMAIL;
  if (!apiKey || !from) return { sent: false };

  const c = input.company;
  const what = input.moveType === "ontruiming" ? "ontruiming" : "verhuizing";

  const res = await mailer(apiKey).emails.send({
    from: `${c.name} <${from}>`,
    to: input.customerEmail,
    replyTo: c.email,
    subject: `Hoe is je ${what} gegaan? — ${c.name}`,
    html: baseLayout(
      c,
      `<p style="font-size:14px">Beste ${esc(input.customerName)},</p>
       <p style="font-size:14px">Bedankt dat je voor ${esc(c.name)} hebt gekozen. We hopen dat je ${what} goed is verlopen!</p>
       <p style="font-size:14px">Wil je ons helpen met een korte review? Het kost maar een minuut en helpt anderen bij het kiezen van een verhuizer.</p>
       <div style="margin:24px 0;text-align:center">${brandButton(c, input.reviewUrl, "Schrijf een review")}</div>
       <p style="font-size:14px">Ging er iets niet goed? Antwoord dan op deze mail, dan horen we het graag.</p>
       ${signatureBlock(c)}`,
    ),
  });
  return { sent: !res.error };
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
    ? `${input.customerName} wil boeken: ${formatEuroCents(input.totalCents)}`
    : "Een klant wil boeken";
  const body = input.showDetails
    ? `<h1 style="font-size:20px">${esc(input.customerName)} wil de ${what} boeken</h1>
       <table style="font-size:14px;margin:16px 0">
         <tr><td style="padding:2px 12px 2px 0;color:#64748b">Bedrag</td><td><strong>${formatEuroCents(input.totalCents)}</strong> incl. btw</td></tr>
         ${input.moveDate ? `<tr><td style="padding:2px 12px 2px 0;color:#64748b">Voorkeursdatum</td><td>${formatDate(input.moveDate)}</td></tr>` : ""}
         <tr><td style="padding:2px 12px 2px 0;color:#64748b">E-mail</td><td>${esc(input.customerEmail)}</td></tr>
         ${input.customerPhone ? `<tr><td style="padding:2px 12px 2px 0;color:#64748b">Telefoon</td><td>${esc(input.customerPhone)}</td></tr>` : ""}
       </table>
       <p style="font-size:14px">Bevestig de afspraak met de klant en zet de lead daarna op <strong>Gewonnen</strong>.</p>`
    : `<h1 style="font-size:20px">Een klant wil een ${what} boeken</h1>
       <p style="font-size:14px">Je proefperiode is afgelopen. Activeer een plan om de gegevens van deze klant te zien.</p>`;

  try {
    await mailer(apiKey).emails.send({
      from: sender("moverAI", "aanvragen") ?? `moverAI <${from}>`,
      to: c.email,
      // Zonder plan geen klantgegevens: antwoorden gaan dan naar moverAI.
      replyTo: input.showDetails ? input.customerEmail : CONTACT_EMAIL,
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

/**
 * Bevestiging aan de klant na "Bevestig mijn boeking". Bewust "boekingsverzoek"
 * en "voorkeursdatum": de verhuizer moet de afspraak nog definitief maken.
 */
export async function sendBookingConfirmation(input: {
  company: Company;
  customerName: string;
  customerEmail: string;
  moveType: string;
  /** Voorkeursdatum uit de widget (optioneel); zonder datum geen datum in de mail. */
  moveDate?: string | null;
  fromAddress?: string | null;
  toAddress?: string | null;
  totalCents: number;
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.QUOTE_FROM_EMAIL;
  if (!apiKey || !from) return { sent: false };

  const c = input.company;
  const what = input.moveType === "ontruiming" ? "ontruiming" : "verhuizing";
  const when = input.moveDate ? `, met als voorkeursdatum ${formatDate(input.moveDate)}` : "";
  const contact = c.phone
    ? `Vragen? Bel ${esc(c.phone)} of antwoord op deze mail.`
    : "Vragen? Antwoord gewoon op deze mail.";
  const addressRows = [
    input.fromAddress
      ? `<tr><td style="padding:2px 12px 2px 0;color:#64748b">${input.toAddress ? "Van" : "Adres"}</td><td>${esc(input.fromAddress)}</td></tr>`
      : "",
    input.toAddress
      ? `<tr><td style="padding:2px 12px 2px 0;color:#64748b">Naar</td><td>${esc(input.toAddress)}</td></tr>`
      : "",
  ].join("");

  try {
    await mailer(apiKey).emails.send({
      from: `${c.name} <${from}>`,
      to: input.customerEmail,
      replyTo: c.email,
      subject: `Je boekingsverzoek is ontvangen — ${c.name}`,
      html: baseLayout(
        c,
        `<h1 style="font-size:20px">Je boekingsverzoek is ontvangen</h1>
         <p style="font-size:14px">Beste ${esc(input.customerName)},</p>
         <p style="font-size:14px">Bedankt! ${esc(c.name)} heeft je verzoek ontvangen om je ${what} te boeken${when} (${formatEuroCents(input.totalCents)} incl. btw). We nemen binnenkort contact met je op om de datum en de details definitief te maken.</p>
         ${addressRows ? `<table style="font-size:14px;margin:16px 0">${addressRows}</table>` : ""}
         <p style="font-size:14px">${contact}</p>
         ${signatureBlock(c)}`,
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
        `<tr><td style="padding:2px 12px 2px 0;width:180px;color:#64748b">${esc(k)}</td><td>${esc(v)}</td></tr>`,
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

function companyEmailHtml(d: QuoteData, banner = "", footer = ""): string {
  return baseLayout(
    d.company,
    `${banner}<h1 style="font-size:20px">Nieuwe offerteaanvraag</h1>
     <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
       <tr><td style="padding:2px 12px 2px 0;width:180px;color:#64748b">Naam</td><td>${esc(d.customer.name)}</td></tr>
       <tr><td style="padding:2px 12px 2px 0;width:180px;color:#64748b">E-mail</td><td><a href="mailto:${esc(d.customer.email)}">${esc(d.customer.email)}</a></td></tr>
       ${d.customer.phone ? `<tr><td style="padding:2px 12px 2px 0;width:180px;color:#64748b">Telefoon</td><td>${esc(d.customer.phone)}</td></tr>` : ""}
     </table>
     ${planningBlock(d)}
     ${moveSummary(d)}
     ${detailRows(d.details)}
     <h3 style="font-size:16px">Berekende prijs</h3>
     ${priceBlock(d, true)}
     ${photoBlock(d.photoUrls)}
     <h3 style="font-size:16px">Volledige inventarislijst</h3>
     ${inventoryBlock(d)}
     ${d.leadId === "demo" ? "" : `<p style="font-size:12px;color:#64748b">Lead-id: ${esc(d.leadId)}</p>`}
     ${footer}`,
  );
}

/**
 * Verstuurt twee e-mails: één naar de klant, één naar het verhuisbedrijf.
 * Gooit geen fout als e-mail niet is geconfigureerd (lead wordt dan toch opgeslagen).
 * `demo`: de bezoeker van de demo (een verhuizer) krijgt beide mails, elk met een
 * balk erboven die zegt wiens mail het is.
 */
export async function sendQuoteEmails(
  d: QuoteData,
  opts: {
    customerOnly?: boolean;
    demo?: boolean;
    /** Demo: link "Plan een adviesgesprek" onderaan de verhuizersmail. */
    meetingUrl?: string | null;
  } = {},
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.QUOTE_FROM_EMAIL;
  if (!apiKey || !from) {
    return { sent: false, error: "RESEND_API_KEY of QUOTE_FROM_EMAIL ontbreekt" };
  }

  const resend = mailer(apiKey);
  const fromHeader = `${d.company.name} <${from}>`;

  if (opts.demo) {
    // Na elkaar, in de volgorde van het onderwerp (1/2 klant, 2/2 verhuizer).
    try {
      const first = await resend.emails.send({
        from: sender("moverAI demo offerte", "demo-offerte") ?? fromHeader,
        to: d.customer.email,
        replyTo: CONTACT_EMAIL,
        subject: "Zo krijgt je klant zijn offerte",
        html: customerEmailHtml(d, demoBanner("Demo · Deze mail krijgt jouw klant, in jouw huisstijl.")),
      });
      const second = await resend.emails.send({
        from: sender("moverAI demo aanvraag", "demo-aanvraag") ?? `moverAI <${from}>`,
        to: d.customer.email,
        replyTo: CONTACT_EMAIL,
        subject: `Zo krijg jij de aanvraag binnen: ${formatEuroCents(d.totalCents)}`,
        html: companyEmailHtml(
          d,
          demoBanner("Demo · Deze mail krijg jij als verhuizer bij elke nieuwe aanvraag."),
          opts.meetingUrl ? demoInvite(opts.meetingUrl) : "",
        ),
      });
      const error = first.error ?? second.error;
      return error ? { sent: false, error: error.message } : { sent: true };
    } catch (err) {
      return { sent: false, error: err instanceof Error ? err.message : "onbekende fout" };
    }
  }

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
        // Afzender moverAI: een mail "van" je eigen bedrijfsnaam aan jezelf lijkt
        // op vervalsing en belandt in de spam.
        from: sender("moverAI", "aanvragen") ?? `moverAI <${from}>`,
        to: d.company.email,
        replyTo: d.customer.email,
        subject: `Nieuwe aanvraag van ${d.customer.name}: ${formatEuroCents(d.totalCents)}`,
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
